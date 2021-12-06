import React from 'react';
import { DivPanelChildProps } from './types';
import { css } from 'emotion';
import * as GrafanaUI from '@grafana/ui';

export const DivPanelChild = (props: DivPanelChildProps) => {
  const { options } = props;

  const reactComponent = new Function(
    'React, GrafanaUI, css, myComponent',
    `${options.transformed}; return myComponent`
  )(React, GrafanaUI, css, new Function());
  return reactComponent();
};
