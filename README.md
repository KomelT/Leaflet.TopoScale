# Leaflet.TopoScale

## Quick Start

1. Include Leaflet.TopoScale CSS and JS into your project:

```html
<!-- Topo Scale https://github.com/KomelT/Leaflet.TopoScale -->
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/KomelT/Leaflet.TopoScale/dist/leaflet.toposcale.min.css"
/>
<script
  src="./Leaflet.TopoScale/dist/leaflet.toposcale.min.js"
  charset="utf-8"
></script>
```

2. Add the TopoScale control:

```js
L.control.toposcale().addTo(map);
```

## Options

```js
L.control
  .toposcale({
    position: "bottomright",
    updateWhenIdle: true,
    thousand_separator: ".",
    scale_separator: ":",
  })
  .addTo(map);
```

| Option             | Type    | Default       | Description                                                                                     |
| ------------------ | ------- | ------------- | ----------------------------------------------------------------------------------------------- |
| position           | String  | 'bottomright' | The position of the control (one of the map corners). See control positions.                    |
| updateWhenIdle     | Boolean | false         | If true, the control is updated on moveend, otherwise it's always up-to-date (updated on move). |
| thousand_separator | String  | '.'           | Character separting thousands inside scale factor. (25.000)                                     |
| scale_separator    | String  | ':'           | Character separating number 1 and scale factor. (1:25.000)                                      |

## Inspired by & credit

Project is inpired & code originates from [MarcChasse/leaflet.ScaleFactor](https://github.com/MarcChasse/leaflet.ScaleFactor) project.
