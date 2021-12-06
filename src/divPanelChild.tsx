import React from 'react';
import { DivPanelChildProps } from './types';

export const DivPanelChild = (props: DivPanelChildProps) => {
  const { options } = props;
  // var MyChildComponent = function () { return React.createElement( 'div', null, myComponentString ); }
  // var myComponent = function () { return React.createElement( 'div', null, React.createElement( MyChildComponent, null ) ); }

  const reactComponent = new Function(`React, ${options.exportedFn}`, `${options.transformed}; return ${options.exportedFn}`)(
    React,
    new Function()
  );
  return reactComponent();
};
