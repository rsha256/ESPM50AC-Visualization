const Feature = ol.Feature;
const Map = ol.Map;
const View = ol.View;
const GeoJSON = ol.format.GeoJSON;
const Circle = ol.geom.Circle;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { OSM, Vector: VectorSource } = ol.source;
const { Circle: CircleStyle, Fill, Stroke, Style } = ol.style;

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    // vectorLayer
  ],
  target: "demoMap",
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
map
  .getView()
  .setCenter(ol.proj.transform([-119.6, 36.6], "EPSG:4326", "EPSG:3857"))
map
  .getView()  
  .setZoom(6);


var styleFunction = function (feature) {
  // console.log(feature.getGeometry().getKeys());
  return new Style({
    stroke: new Stroke({
      color: "red",
      // lineDash: [4],
      width: 0.1,
    }),
    fill: new Fill({
      color: "rgba(0, 0, 255, 0.1)",
    }),
  });
  // return styles[feature.getGeometry().getType()];
};

axios
  .get("/static/data/counties.json")
  .then((res) => {
    console.log("county map dl complete ");
    const countiesData = res.data;
    const geoJsonObj = {
      type: "FeatureCollection",
      features: [],
    };
    geoJsonObj.features = countiesData.map((county) => {
      const coords = JSON.parse(
        JSON.stringify(county.geometry.map((c) => c.map((p) => parseFloat(p))))
      );
      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      };
    });

    var vectorSource = new VectorSource({
      features: new GeoJSON({
        featureProjection: "EPSG:3857",
        dataProjection: "EPSG:4326",
      }).readFeatures(geoJsonObj),
    });

    var vectorLayer = new VectorLayer({
      source: vectorSource,
      style: styleFunction,
    });

    map.addLayer(vectorLayer);
  })
  .catch((e) => console.log(e));

var image = new CircleStyle({
  radius: 5,
  fill: null,
  stroke: new Stroke({ color: "red", width: 1 }),
});

var styles = {
  Point: new Style({
    image: image,
  }),
  LineString: new Style({
    stroke: new Stroke({
      color: "green",
      width: 1,
    }),
  }),
  MultiLineString: new Style({
    stroke: new Stroke({
      color: "green",
      width: 1,
    }),
  }),
  MultiPoint: new Style({
    image: image,
  }),
  MultiPolygon: new Style({
    stroke: new Stroke({
      color: "yellow",
      width: 1,
    }),
    fill: new Fill({
      color: "rgba(255, 255, 0, 0.1)",
    }),
  }),
  Polygon: new Style({
    stroke: new Stroke({
      color: "blue",
      lineDash: [4],
      width: 3,
    }),
    fill: new Fill({
      color: "rgba(0, 0, 255, 0.1)",
    }),
  }),
  GeometryCollection: new Style({
    stroke: new Stroke({
      color: "magenta",
      width: 2,
    }),
    fill: new Fill({
      color: "magenta",
    }),
    image: new CircleStyle({
      radius: 10,
      fill: null,
      stroke: new Stroke({
        color: "magenta",
      }),
    }),
  }),
  Circle: new Style({
    stroke: new Stroke({
      color: "red",
      width: 2,
    }),
    fill: new Fill({
      color: "rgba(255,0,0,0.2)",
    }),
  }),
};

var geojsonObject = {
  type: "FeatureCollection",
  crs: {
    type: "name",
    properties: {
      name: "EPSG:3857",
    },
  },
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [4e6, -2e6],
          [8e6, 2e6],
        ],
        some_val: 1,
        data: {
          density: 100,
        },
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [4e6, 2e6],
          [8e6, -2e6],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-5e6, -1e6],
            [-4e6, 1e6],
            [-3e6, -1e6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [-1e6, -7.5e5],
            [-1e6, 7.5e5],
          ],
          [
            [1e6, -7.5e5],
            [1e6, 7.5e5],
          ],
          [
            [-7.5e5, -1e6],
            [7.5e5, -1e6],
          ],
          [
            [-7.5e5, 1e6],
            [7.5e5, 1e6],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [-5e6, 6e6],
              [-5e6, 8e6],
              [-3e6, 8e6],
              [-3e6, 6e6],
            ],
          ],
          [
            [
              [-2e6, 6e6],
              [-2e6, 8e6],
              [0, 8e6],
              [0, 6e6],
            ],
          ],
          [
            [
              [1e6, 6e6],
              [1e6, 8e6],
              [3e6, 8e6],
              [3e6, 6e6],
            ],
          ],
        ],
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: [
          {
            type: "LineString",
            coordinates: [
              [-5e6, -5e6],
              [0, -5e6],
            ],
          },
          {
            type: "Point",
            coordinates: [4e6, -5e6],
          },
          {
            type: "Polygon",
            coordinates: [
              [
                [1e6, -6e6],
                [2e6, -4e6],
                [3e6, -6e6],
              ],
            ],
          },
        ],
      },
    },
  ],
};

geojsonObject = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-98.0859375, 37.43997405227057],
            [-90.3515625, 21.616579336740603],
            [-78.3984375, 28.304380682962783],
            [-98.0859375, 37.43997405227057],
          ],
        ],
      },
    },
  ],
};

// var vectorSource = new VectorSource({
//   features: new GeoJSON({
//     featureProjection: 'EPSG:3857',
//     dataProjection: 'EPSG:4326'
//   }).readFeatures(geojsonObject),
// });

// var vectorLayer = new VectorLayer({
//   source: vectorSource,
//   style: styleFunction,
// });

// map.addLayer(vectorLayer);

// new Map({
//   // layers: [
//   //   new TileLayer({
//   //     source: new OSM()
//   //   }),
//   //   vectorLayer
//   // ],
//   target: 'map',
//   // view: new View({
//   //   center: [0, 0],
//   //   zoom: 2
//   // })
// });
