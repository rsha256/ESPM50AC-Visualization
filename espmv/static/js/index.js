const Feature = ol.Feature;
const Map = ol.Map;
const View = ol.View;
const GeoJSON = ol.format.GeoJSON;
const Circle = ol.geom.Circle;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { OSM, Vector: VectorSource } = ol.source;
const { Circle: CircleStyle, Fill, Stroke, Style } = ol.style;

// BEGIN CONFIG
const GEOJSON_CONFIG = {
  featureProjection: "EPSG:3857",
  dataProjection: "EPSG:4326",
};
const STYLES = {
  default: {
    color: "red",
    width: 0.5,
    lineDash: null,
    fill: {
      r: 0,
      g: 0,
      b: 255,
      a: 0.5,
    },
  },
};

const INITIAL_COORDS = [-119.6, 36.6];
const INITIAL_ZOOM = 11;
const BASE_LAYER = new TileLayer({
  source: new OSM({
    url: "https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png",
  }),
});

let COUNTIES_BASEMAP_DATA = {};
let COUNTIES_DATA = {};
let CURRENT_STAT = "race_total_population_one_race_asian";
let CURRENT_AREA = "sf";
// END CONFIG

// BEGIN SETUP
const map = new Map({
  layers: [BASE_LAYER],
  target: "mainMap",
});
map.getView().setCenter(ol.proj.transform(INITIAL_COORDS, "EPSG:4326", "EPSG:3857"));
map.getView().setZoom(INITIAL_ZOOM);
// END SETUP

function getStyleForFeature(statName, regionName, statMax) {
  const statStyle = STYLES[statName] || {};
  const maxOpacity = (statStyle.fill && statStyle.fill.a) || STYLES.default.fill.a;
  const adjustedOpacity =
    (((COUNTIES_DATA[regionName] && COUNTIES_DATA[regionName][[statName]]) || 0) / statMax) * maxOpacity;

  return new Style({
    stroke: new Stroke({
      color: statStyle.color || STYLES.default.color,
      lineDash: statStyle.lineDash || STYLES.default.lineDash,
      width: statStyle.width || STYLES.default.width,
    }),
    fill: new Fill({
      color: `rgba(${(statStyle.fill && statStyle.fill.r) || STYLES.default.fill.r}, ${
        (statStyle.fill && statStyle.fill.g) || STYLES.default.fill.g
      }, ${(statStyle.fill && statStyle.fill.b) || STYLES.default.fill.b}, ${
        isNaN(adjustedOpacity) ? maxOpacity : adjustedOpacity
      })`,
    }),
  });
}

function renderLayers_counties(statName = CURRENT_STAT) {
  map.getLayers().forEach(layer => map.removeLayer(layer));
  map.addLayer(BASE_LAYER);

  const countiesData = COUNTIES_BASEMAP_DATA;
  const statAggregate = Object.values(COUNTIES_DATA).map(countyData => countyData[statName]);

  const features = countiesData.map(county => {
    const coords = JSON.parse(JSON.stringify(county.geometry.map(c => c.map(p => parseFloat(p)))));
    const feature = new GeoJSON(GEOJSON_CONFIG).readFeature({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
    feature.set("data", {});
    feature.setStyle(getStyleForFeature(statName, county.name, statAggregate));
    return feature;
  });

  var vectorLayer = new VectorLayer({
    source: new VectorSource({ features }),
  });

  map.addLayer(vectorLayer);
}

function renderLayers_block_groups(statName = CURRENT_STAT) {
  map.getLayers().forEach(layer => map.removeLayer(layer));
  map.addLayer(BASE_LAYER);

  const blockGroupData = COUNTIES_BASEMAP_DATA;
  // const statAggregate = Object.values(COUNTIES_DATA).map(countyData => countyData[statName]);

  const features = blockGroupData.features.map(block => {
    const coords = JSON.parse(JSON.stringify(block.c));
    const feature = new GeoJSON(GEOJSON_CONFIG).readFeature({
      type: "Feature",
      properties: {
        AFFGEOID: block.i,
      },
      geometry: {
        type: block.m === 1 ? "MultiPolygon" : "Polygon",
        coordinates: coords,
      },
    });
    feature.setStyle(getStyleForFeature(statName, block.i));
    return feature;
  });

  var vectorLayer = new VectorLayer({
    source: new VectorSource({ features }),
  });

  map.addLayer(vectorLayer);
  map.getView().setCenter(ol.proj.transform(blockGroupData.center || INITIAL_COORDS, "EPSG:4326", "EPSG:3857"));
  map.getView().setZoom(blockGroupData.zoom || INITIAL_ZOOM);
}

// axios
//   .get("/static/data/counties_basemap.json")
//   .then(res => {
//     console.log("county basemap dl complete");
//     COUNTIES_BASEMAP_DATA = res.data;
//     return axios.get("/static/data/counties.json");
//   })
//   .then(res => {
//     console.log("county map dl complete");
//     COUNTIES_DATA = res.data;
//     renderLayers_counties();
//   })
//   .catch(e => console.log(e));

axios
  .get(`/static/data/${CURRENT_AREA}_block_groups.json`)
  .then(res => {
    console.log("block groups basemap dl complete");
    COUNTIES_BASEMAP_DATA = res.data;
    renderLayers_block_groups();
    // return axios.get("/static/data/counties.json");
  })
  // .then(res => {
  //   console.log("county map dl complete");
  //   COUNTIES_DATA = res.data;
  //   renderLayers_counties();
  // })
  .catch(e => console.log(e));
