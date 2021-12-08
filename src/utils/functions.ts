import postscribe from 'postscribe';
import { DataFrame, PanelData } from '@grafana/data';
import { DivPanelParsedHtml } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ScriptArgs {
  data?: DataFrame[];
  elem: HTMLDivElement;
  code: HTMLScriptElement;
}

let scriptsLoaded: Record<string, boolean> = {};
let linksLoaded: Record<string, boolean> = {};
let divGlobals: any = {};

function createElementFromHTML<T extends HTMLElement>(htmlString: string): T {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild as T;
}

export const init = (elem: Element, code: HTMLScriptElement): any => {
  try {
    const f = new Function(
      'divGlobals',
      'elem',
      `
      ${code.textContent}
      if (typeof onDivPanelInit === 'function') {
        onDivPanelInit(elem);
      }
    `
    );
    f(divGlobals, elem);
  } catch (ex) {
    throw ex;
  }
};

export const loadMeta = (elem: HTMLMetaElement): Promise<any> => {
  return new Promise((resolve) => {
    postscribe(document.head, elem.outerHTML, {
      done: () => resolve(elem),
    });
  });
};

export const loadCSS = (elem: HTMLLinkElement): Promise<any> => {
  return new Promise((resolve) => {
    const href = elem.getAttribute('href');
    if (href && !linksLoaded[href]) {
      postscribe(document.head, elem.outerHTML, {
        done: () => {
          linksLoaded[href] = true;
          resolve(elem);
        },
      });
    } else {
      resolve(elem);
    }
  });
};

export const loadCSSFromString = async (htmlString: string) => {
  const elem: HTMLLinkElement = createElementFromHTML<HTMLLinkElement>(htmlString);
  return loadCSS(elem);
};

export const load = async (elem: HTMLScriptElement, container?: HTMLElement): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      const url = elem.getAttribute('src');
      if (url && scriptsLoaded && !scriptsLoaded[url]) {
        postscribe(container || document.head, elem.outerHTML, {
          done: () => {
            fetch(url, { mode: 'no-cors' })
              .then((response: Response) => response.text())
              .then((code) => {
                let res = new Function(code)();
                scriptsLoaded[url] = true;
                resolve(res);
              })
              .catch((err) => {
                console.error("here's an error", err);
                reject(err);
              });
          },
          error: (err: any) => {
            console.error('rejecting', err);
            reject(err);
          },
        });
      } else {
        resolve('scripts already loaded');
      }
    } catch (ex) {
      reject(ex);
    }
  });
};

export const loadFromString = async (htmlString: string) => {
  const elem: HTMLScriptElement = createElementFromHTML<HTMLScriptElement>(htmlString);
  return load(elem);
};

export const loadModule = async (
  elem: HTMLScriptElement,
  panelData: PanelData,
  container?: HTMLElement
): Promise<any> => {
  return new Promise((resolve, reject) => {
    try {
      if (container) {
        const uuid = uuidv4();
        container.id = uuid;
        elem.innerHTML = `
          var divPanelElementUUID = "${uuid}";
          var divPanelContainer = document.getElementById("${uuid}");
          ${elem.innerHTML};
        `;
        postscribe(container || document.head, elem.outerHTML, {
          done: (result: any) => {
            resolve(result);
          },
          error: (err: any) => {
            reject(err);
          },
        });
      }
    } catch (ex) {
      reject(ex);
    }
  });
};

export const run = (args: ScriptArgs): string => {
  try {
    const f = new Function(
      'divGlobals',
      'data',
      'elem',
      `
      ${args.code.textContent}

      if (data && typeof onDivPanelDataUpdate === 'function') {
        onDivPanelDataUpdate(data, elem);
      }
    `
    );
    return f(divGlobals, args.data, args.elem);
  } catch (ex) {
    throw ex;
  }
};

export const runEnterEditMode = (elem: Element, script: HTMLScriptElement) => {
  try {
    const f = new Function(
      'divGlobals',
      'elem',
      `
      ${script.textContent}

      if (typeof onDivPanelEnterEditMode === 'function') {
        onDivPanelEnterEditMode(elem);
      }
    `
    );
    return f(divGlobals, elem);
  } catch (ex) {
    throw ex;
  }
};

export const runExitEditMode = (elem: Element, script: HTMLScriptElement): string => {
  try {
    const f = new Function(
      'divGlobals',
      'elem',
      `
      ${script.textContent}

      if (typeof onDivPanelExitEditMode === 'function') {
        return onDivPanelExitEditMode(elem);
      }
    `
    );
    return f(divGlobals, elem);
  } catch (ex) {
    throw ex;
  }
};

export const hasEditModeFunctions = (text: string): boolean => {
  return text.includes('onDivPanelEnterEditMode') && text.includes('onDivPanelExitEditMode');
};

export const parseHtml = (content: string, error?: string): DivPanelParsedHtml => {
  const scripts: HTMLScriptElement[] = [];
  const imports: HTMLScriptElement[] = [];
  const links: HTMLLinkElement[] = [];
  const meta: HTMLMetaElement[] = [];
  const modules: HTMLScriptElement[] = [];
  const divElement: HTMLDivElement = document.createElement('div');

  const parser = new DOMParser();
  const newDoc = parser.parseFromString(content, 'text/html');
  const head: HTMLHeadElement = newDoc.documentElement.children[0] as HTMLHeadElement;
  const body: HTMLBodyElement = newDoc.documentElement.children[1] as HTMLBodyElement;

  for (let i = 0; i < head.children.length; i++) {
    switch (head.children[i].nodeName) {
      case 'META':
        document.head.appendChild(head.children[i].cloneNode(true) as HTMLMetaElement);
        break;
      case 'LINK':
        document.head.appendChild(head.children[i].cloneNode(true) as HTMLLinkElement);
        break;
      case 'STYLE':
        document.head.appendChild(head.children[i].cloneNode(true));
        break;
      case 'SCRIPT':
        imports.push(head.children[i].cloneNode(true) as HTMLScriptElement);
        document.head.appendChild(head.children[i].cloneNode(true));
        break;
      default:
        break;
    }
  }

  for (let i = 0; i < body.children.length; i++) {
    switch (body.children[i].nodeName) {
      case 'SCRIPT':
        if (body.children[i].getAttribute('src')) {
          document.body.appendChild(body.children[i].cloneNode(true) as HTMLScriptElement);
        } else if (body.children[i].getAttribute('type') === 'module') {
          let temp: HTMLScriptElement = body.children[i].cloneNode(true) as HTMLScriptElement;
          modules.push(temp);
        } else {
          switch (body.children[i].getAttribute('run')?.toLowerCase()) {
            case 'oninit':
              {
                let temp: HTMLScriptElement = body.children[i].cloneNode(true) as HTMLScriptElement;
                temp.textContent = `function onDivPanelInit(elem) {
                  ${temp.textContent}
                }
              `;
                scripts.push(temp);
              }
              break;
            case 'onentereditmode':
              {
                let temp: HTMLScriptElement = body.children[i].cloneNode(true) as HTMLScriptElement;
                temp.textContent = `function onDivPanelEnterEditMode(elem) {
                  ${temp.textContent}
                }
              `;
                scripts.push(temp);
              }
              break;
            case 'onexiteditmode':
              {
                let temp: HTMLScriptElement = body.children[i].cloneNode(true) as HTMLScriptElement;
                temp.textContent = `function onDivPanelExitEditMode(elem) {
                  ${temp.textContent}
                }
              `;
                scripts.push(temp);
              }
              break;
            case 'ondata':
              {
                let temp: HTMLScriptElement = body.children[i].cloneNode(true) as HTMLScriptElement;
                temp.textContent = `function onDivPanelDataUpdate(data, elem) {
                  ${temp.textContent}
                }
              `;
                scripts.push(temp);
              }
              break;
            default:
              scripts.push(body.children[i].cloneNode(true) as HTMLScriptElement);
              break;
          }
        }

        break;
      case 'STYLE':
        divElement.appendChild(body.children[i].cloneNode(true));
        break;
      default:
        divElement.appendChild(body.children[i].cloneNode(true));
        break;
    }
  }

  let html = divElement.innerHTML;
  if (error) {
    html = error;
  }

  return {
    html,
    meta,
    scripts,
    modules,
    imports,
    links,
  };
};

export const parseScripts = (content: string) => {
  const scripts: HTMLScriptElement[] = [];
  const parser = new DOMParser();
  const newDoc = parser.parseFromString(content, 'text/html');
  const body: HTMLBodyElement = newDoc.documentElement.children[1] as HTMLBodyElement;

  for (let i = 0; i < body.children.length; i++) {
    switch (body.children[i].nodeName) {
      case 'SCRIPT':
        scripts.push(body.children[i].cloneNode(true) as HTMLScriptElement);
        break;
    }
  }

  return scripts;
};

export const loadDependencies = async (
  elem: Element,
  imports: HTMLScriptElement[],
  meta: HTMLMetaElement[]
): Promise<any> => {
  let promises: Array<Promise<any>> = [];

  let container: HTMLElement | null | undefined = elem?.parentElement;
  if (container) {
    container = container.parentElement?.parentElement?.parentElement;
  }
  if (container) {
    for (const i of imports) {
      promises.push(load(i, container));
    }
    for (const i of meta) {
      promises.push(loadMeta(i));
    }
  } else {
    throw "We didn't have a container, so we didn't load dependencies";
  }

  return Promise.all(promises);
};
