((function (factory, window) {

  // define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
      define(['leaflet'], factory);

  // define a Common JS module that relies on 'leaflet'
  } else if (typeof exports === 'object') {
      module.exports = factory(require('leaflet'));
  }

  // attach your plugin to the global 'L' variable
  if (typeof window !== 'undefined' && window.L) {
    window.L.Control.TopoScale = factory(L);
    L.control.toposcale = options => new window.L.Control.TopoScale(options);
  }
})(function (L) {
  var ScaleFactor = L.Control.extend({
      options: {
          position: 'bottomright',
          updateWhenIdle: true,
					scale_text: "Merilo",
					scale_cm_text: "1 cm na karti je v naravi",
          thousand_separator: ".",
          scale_separator: ':',
      },

      onAdd: function (map) {
          var className = 'leaflet-control-toposcale',
              container = L.DomUtil.create('div', className),
              options = this.options;

          this._mScale = L.DomUtil.create('div', className + '-line', container);

          map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
          map.whenReady(this._update, this);

          return container;
      },

      onRemove: function (map) {
          map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
      },

      _pxTOmm: (function () {
          var heightRef = document.createElement('div');
          heightRef.style = 'height:1mm;visibility:hidden';
          heightRef.id = 'heightRef';
          document.body.appendChild(heightRef);

          heightRef = document.getElementById('heightRef');
          var pxPermm = heightRef.offsetHeight;

          heightRef.parentNode.removeChild(heightRef);

          return function pxTOmm(px) {
              return px / pxPermm;
          }
      })(),

			_mmTOpx: (function () {
				// Create a temporary div to measure the conversion rate
				const heightRef = document.createElement('div');
				heightRef.style.cssText = 'height:1mm;visibility:hidden;position:absolute;'; // Use position:absolute to ensure it doesn't affect layout
				document.body.appendChild(heightRef);

				// Get the height of the div in pixels, which equals the pixels per mm
				const pxPermm = heightRef.offsetHeight;

				// Clean up by removing the div from the document
				document.body.removeChild(heightRef);

				return function mmTOpx(mm) {
						return mm * pxPermm;
				}
		})(),

      _update: function () {
          var map = this._map;

          var CenterOfMap = map.getSize().y / 2;

          var RealWorlMetersPer100Pixels = map.distance(
              map.containerPointToLatLng([0, CenterOfMap]),
              map.containerPointToLatLng([100, CenterOfMap])
          );

        	var ScreenMetersPer100Pixels = this._pxTOmm(100) / 1000;

          var scaleFactor = RealWorlMetersPer100Pixels / ScreenMetersPer100Pixels;

					if (scaleFactor >= 23000 && scaleFactor <= 27000) scaleFactor = 25000

          // Formats end look
          const scale = '1' + this.options.scale_separator + Math.round(scaleFactor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.options.thousand_separator);
          this._mScale.innerHTML = '<canvas width="300" height="100" id="topo-scale-canvas"></canvas>'

          setTimeout(() => {
						const canvas = document.getElementById('topo-scale-canvas');
						if(!canvas) return ""
						const ctx = canvas.getContext('2d');

						const lp = 5 // Left Padding
						const cmpxs = this._mmTOpx(10) // Pixles per cm

						ctx.font = "bold 20px Arial";
						ctx.fillText(`${this.options.scale_text} ${scale}`, lp, 20);

						let meters = scaleFactor / 100
						if ((scaleFactor / 100) < 10) meters = (scaleFactor / 100).toFixed(2)
						if ((scaleFactor / 100) > 10) meters = (scaleFactor / 100).toFixed(0)

						ctx.beginPath();
						ctx.rect(lp, 60, cmpxs * 4 + 0.1, 0.3) // bottom
						for (let i = 0; i < 5; i++) ctx.rect(cmpxs * i + lp, 50, 0.1, 10);
						for (let i = 0; i < 9; i++) ctx.rect((cmpxs / 2) * i + lp, 53, 0.1, 7);
						for (let i = 0; i < 10; i++) ctx.rect((cmpxs / 10) * i + lp, 56, 0.1, 4);
						ctx.stroke();

						ctx.font = "normal 8px Arial";
						for (let i = 0; i < 5; i++) ctx.fillText(`${meters * i} m`, cmpxs * i + lp - 1, 40);

						ctx.font = "normal 10px Arial";
						ctx.fillText(`${this.options.scale_cm_text} ${meters} m`, 5, 90);
        	}, 1)
      }

  });

  return ScaleFactor;
}, window));