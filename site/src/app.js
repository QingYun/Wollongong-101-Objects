import Aviator from 'aviator';

import './stylesheets/app.scss';
import data from '../asset/data.json';
import * as IndexPage from './pages/index.js';
import * as ObjectPage from './pages/object.js';

document.addEventListener('DOMContentLoaded', () => {
  const renderTarget = document.getElementById('render-target');
  const routingTarget = {
    toIndex: () => {
      Aviator.navigate('/index.html');
    },

    showIndex: () => {
      renderTarget.innerHTML = IndexPage.renderTemplate(data);
      IndexPage.attachEvents(renderTarget);
    },

    showObject: (req) => {
      const objIndex = parseInt(req.params.index, 10);
      if (isNaN(objIndex)) return Aviator.navigate('/index.html');
      renderTarget.innerHTML = ObjectPage.renderTemplate(data, objIndex);
      ObjectPage.attachEvents(renderTarget);
      return true;
    },
  };

  Aviator.setRoutes({
    target: routingTarget,
    '/': 'toIndex',
    '/index.html': 'showIndex',
    notFound: 'showObject',
  });

  Aviator._navigator.onClick = function onClick(e) {
    let target = e.target;

    if (e.metaKey || e.ctrlKey) return;

    while (target) {
      if (this._matchesSelector(target)) {
        break;
      }

      target = target.parentNode;
    }

    if (!target) return;

    e.preventDefault();

    let pathname = target.pathname;

    if (pathname.charAt(0) !== '/') pathname = `/${pathname}`;

    const uri = pathname.replace(this.root, '');

    const options = {};
    if (target.search !== '') {
      options.queryParams = target.search
        .replace(/(^\?)/, '')
        .split('&')
        .reduce((acc, pairStr) => {
          const pair = pairStr.split('=');
          return Object.assign(acc, {
            [pair[0]]: pair[1],
          });
        }, {});
    }

    this.navigate(uri, options);
  };

  Aviator.dispatch();
});
