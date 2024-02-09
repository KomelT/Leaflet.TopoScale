((factory, window) => {

  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet'], factory);

    // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
    module.exports = factory(require('leaflet'));
  } else if (typeof window !== 'undefined' && window.L) {
    
    // attach your plugin to the global 'L' variable
    window.L.Control.TopoScale = factory(L);
    L.control.toposcale = options => new L.Control.TopoScale(options);
  }
})((L) => {
  const ScaleFactor = L.Control.extend({
    options: {
      position: 'bottomright',
      updateWhenIdle: true,
      scale_text: "Scale",
      scale_cm_text: "1 cm on map is in nature",
      thousand_separator: ".",
      scale_separator: ':',
    },

    onAdd: function (map) {
      const className = 'leaflet-control-toposcale',
            container = L.DomUtil.create('div', className);

      this._mScale = L.DomUtil.create('div', `${className}-line`, container);

      map.on(this.options.updateWhenIdle ? 'moveend' : 'move', this._update.bind(this));
      map.whenReady(this._update.bind(this));

      return container;
    },

    onRemove: function (map) {
      map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update.bind(this));
    },

    _pxTOmm: (() => {
      const heightRef = document.createElement('div');
      heightRef.style.cssText = 'height:1mm;visibility:hidden;';
      document.body.appendChild(heightRef);

      const pxPermm = heightRef.offsetHeight;

      document.body.removeChild(heightRef);

      return px => px / pxPermm;
    })(),

    _mmTOpx: (() => {

      // Create a temporary div to measure the conversion rate
      const heightRef = document.createElement('div');
      heightRef.style.cssText = 'height:1mm;visibility:hidden;position:absolute;';
      document.body.appendChild(heightRef);

      // Get the height of the div in pixels, which equals the pixels per mm
      const pxPermm = heightRef.offsetHeight;

      // Clean up by removing the div from the document
      document.body.removeChild(heightRef);

      return mm => mm * pxPermm;
    })(),

    _update: function () {
      const map = this._map;
      const centerOfMap = map.getSize().y / 2;
      const realWorldMetersPer100Pixels = map.distance(
        map.containerPointToLatLng([0, centerOfMap]),
        map.containerPointToLatLng([100, centerOfMap])
      );
      const screenMetersPer100Pixels = this._pxTOmm(100) / 1000;
      const scaleFactor = realWorldMetersPer100Pixels / screenMetersPer100Pixels;

      const scale = `1${this.options.scale_separator}${Math.round(scaleFactor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.options.thousand_separator)}`;
      this._mScale.innerHTML = '<canvas width="300" height="100" id="topo-scale-canvas"></canvas>';

      setTimeout(() => {
        const canvas = document.getElementById('topo-scale-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const lp = 5; // Left Padding
        const cmpxs = this._mmTOpx(10); // Pixels per cm

        ctx.font = "bold 20px Arial";
        ctx.fillText(`${this.options.scale_text} ${scale}`, lp, 20);

        let meters = scaleFactor / 100;
        if (scaleFactor / 100 < 10) meters = (scaleFactor / 100).toFixed(2);
        else if (scaleFactor / 100 > 10) meters = (scaleFactor / 100).toFixed(0);

        ctx.beginPath();
        ctx.rect(lp, 60, cmpxs * 4 + 0.1, 0.3); // bottom
        for (let i = 0; i < 5; i++) ctx.rect(cmpxs * i + lp, 50, 0.1, 10);
        for (let i = 0; i < 9; i++) ctx.rect((cmpxs / 2) * i + lp, 53, 0.1, 7);
        for (let i = 0; i < 10; i++) ctx.rect((cmpxs / 10) * i + lp, 56, 0.1, 4);
        ctx.stroke();

        ctx.font = "normal 8px Arial";
        for (let i = 0; i < 5; i++) ctx.fillText(`${meters * i} m`, cmpxs * i + lp - 1, 40);

        ctx.font = "normal 10px Arial";
        ctx.fillText(`${this.options.scale_cm_text} ${meters} m`, 5, 90);
      }, 1);
    }
  });

  return ScaleFactor;
}, window);
