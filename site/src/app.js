import Aviator from 'aviator';
import objectAssign from 'object-assign';

import './stylesheets/app.scss';
import data from '../asset/data.json';
import * as IndexPage from './pages/index.js';
import * as ObjectPage from './pages/object.js';
import * as PresentationPage from './pages/presentation.js';

document.addEventListener('DOMContentLoaded', () => {
  const renderTarget = document.getElementById('render-target');
  function render(page, options) {
    const [htmlString, listenEvents] = page.render(data, options);
    renderTarget.innerHTML = htmlString;
    listenEvents(renderTarget);
  }

  let inPresentation = false;
  const routingTarget = {
    toShowAll: () => {
      Aviator.navigate('/index-show-all.html', { replace: true });
    },

    indexShowAll: () => {
      inPresentation = false;
      render(IndexPage, { section: 'show all' });
    },

    indexByCategory: () => {
      inPresentation = false;
      render(IndexPage, { section: 'by theme' });
    },

    showObject: (req) => {
      inPresentation = false;
      const objIndex = parseInt(req.params.index, 10);
      if (isNaN(objIndex)) return Aviator.navigate('/index.html');
      return render(ObjectPage, { objIndex });
    },

    showPresentation: () => {
      if (!inPresentation) {
        render(PresentationPage, {});
        inPresentation = true;
      }
    },
  };

  Aviator.setRoutes({
    target: routingTarget,
    '/': 'toShowAll',
    '/index.html': 'toShowAll',
    '/index-show-all.html': 'indexShowAll',
    '/index-by-category.html': 'indexByCategory',
    '/presentation.html': 'showPresentation',
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
          return objectAssign(acc, {
            [pair[0]]: pair[1],
          });
        }, {});
    }

    this.navigate(uri, options);
  };

  Aviator.pushStateEnabled = true;
  Aviator.dispatch();
});
