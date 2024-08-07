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
      select_scale_text: "Select scale",
      scale_cm_text: "1 cm on map is in nature",
      thousand_separator: ".",
      scale_separator: ':',
    },

    onAdd: function (map) {
      const opt = this.options
      const className = 'leaflet-control-toposcale';
      const container = L.DomUtil.create('div', className);

      // Add scale container to DOM
      this._mScale = L.DomUtil.create('div', `${className}-scale`, container);
      
      // Add scale selector container to DOM
      this._mScaleSelect = L.DomUtil.create('div', `${className}-selector`, container);
      this._mScaleSelect.innerHTML = `
        <select name="scales" id="toposcale-scales-select">
          <option value="" selected>${opt.select_scale_text}</option>
          <option value="5000">1:5${opt.thousand_separator}000</option>
          <option value="10000">1${opt.scale_separator}10${opt.thousand_separator}000</option>
          <option value="25000">1${opt.scale_separator}25${opt.thousand_separator}000</option>
          <option value="50000">1${opt.scale_separator}50${opt.thousand_separator}000</option>
        </select>
        `
      
        // Listen on scale select & bind selection to this._updateScaleSelect
      const selectElement = this._mScaleSelect.querySelector('#toposcale-scales-select');
      selectElement.addEventListener('change', this._updateScaleSelect.bind(this));

      // Listen on map move & bind movement to this._update
      map.on(this.options.updateWhenIdle ? 'moveend' : 'move', this._update.bind(this));
      map.whenReady(this._update.bind(this));

      // Hide selector on print
      addEventListener("beforeprint", (ev) => {
        document.getElementsByClassName("leaflet-control-toposcale-selector")[0].style.display = "none"
      })

      // Show selector after print
      addEventListener("afterprint", (ev) => {
        document.getElementsByClassName("leaflet-control-toposcale-selector")[0].style.display = "block"
      })

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

    _getScaleFactor: (() => {
      return (ths, map) => {
        const centerOfMap = map.getSize().y / 2;
        const realWorldMetersPer100Pixels = map.distance(
          map.containerPointToLatLng([0, centerOfMap]),
          map.containerPointToLatLng([100, centerOfMap])
        );
        const screenMetersPer100Pixels = ths._pxTOmm(100) / 1000;
        const scaleFactor = realWorldMetersPer100Pixels / screenMetersPer100Pixels;

        return scaleFactor
      }
    })(),

    _update: function () {
      const map = this._map;
      const scaleFactor = this._getScaleFactor(this, map)

      // Reset scale selector
      const selectElement = this._mScaleSelect.querySelector('#toposcale-scales-select');
      selectElement.value = ""

      // Format scale text
      const scale = `1${this.options.scale_separator}${Math.round(scaleFactor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.options.thousand_separator)}`;
      
      // Inject canvas into scale container
      this._mScale.innerHTML = '<canvas width="300" height="100" id="topo-scale-canvas"></canvas>';

      setTimeout(() => {
        const canvas = document.getElementById('topo-scale-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    },

    _updateScaleSelect: function(e) {
      const selectedScale = Number.parseFloat(e.target.value);
      if (!selectedScale || Number.isNaN(selectedScale)) return;
    
      const map = this._map;
    
      // Calculate the difference between current and desired scale factor
      const calculateScaleDiff = (zoom) => {
        map.setZoom(zoom);
        const currentScaleFactor = this._getScaleFactor(this, map);
        return selectedScale - currentScaleFactor;
      };
    
      // Initial boundaries for zoom level search
      let minZoom = map.getMinZoom();
      let maxZoom = map.getMaxZoom();
      let currentZoom = map.getZoom();
    
      // Search parameters
      const tolerance = 0.05; // Tolerance for scale factor matching
      const maxIterations = 100; // Prevent infinite loops
      let iteration = 0;
      let scaleDiff = calculateScaleDiff(currentZoom);
    
      // Binary search to find the zoom level that matches the selected scale
      while (Math.abs(scaleDiff) > tolerance && iteration < maxIterations && minZoom < maxZoom) {
        if (scaleDiff < 0) minZoom = currentZoom;
        else maxZoom = currentZoom;
    
        // Update current zoom to the midpoint of the new range
        currentZoom = (minZoom + maxZoom) / 2;
        scaleDiff = calculateScaleDiff(currentZoom);
        iteration++;
      }
    },
  });

  return ScaleFactor;
}, window);
