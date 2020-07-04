const Feature = ol.Feature;
const Map = ol.Map;
const View = ol.View;
const GeoJSON = ol.format.GeoJSON;
const Circle = ol.geom.Circle;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { OSM, Vector: VectorSource } = ol.source;
const { Circle: CircleStyle, Fill, Stroke, Style } = ol.style;

let CURRENT_STAT = "P0060003%";
let CURRENT_AREA = "sf";
let CURRENT_SEA_LEVEL = "1";

// BEGIN CONFIG
const GEOJSON_CONFIG = {
  featureProjection: "EPSG:3857",
  dataProjection: "EPSG:4326",
};
const STYLES = {
  default: {
    color: "red",
    width: 0.1,
    lineDash: null,
    fill: {
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    },
  },
};

const INITIAL_COORDS = [-119.6, 36.6];
const INITIAL_ZOOM = 11.8;
const BASE_LAYER = new TileLayer({
  source: new OSM({
    url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  }),
});

let BASEMAP_DATA = {};
let CENSUS_DATA = {};
let SEA_LEVEL_DATA = {};
let CENSUS_DESCRIPTORS = {};
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
    (((CENSUS_DATA[regionName] && CENSUS_DATA[regionName].properties[statName]) || 0) / statMax) * maxOpacity;

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

  const countiesData = BASEMAP_DATA;
  const statAggregate = Object.values(CENSUS_DATA).map(countyData => countyData[statName]);

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

  // Block groups
  const blockGroupData = BASEMAP_DATA;
  const statMax = Math.max(...Object.values(CENSUS_DATA).map(countyData => countyData.properties[statName]));

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
    feature.setStyle(getStyleForFeature(statName, block.i, statMax));
    return feature;
  });

  var vectorLayer = new VectorLayer({
    source: new VectorSource({ features }),
  });

  map.addLayer(vectorLayer);

  // Sea level
  const slFeatures = SEA_LEVEL_DATA.features.map(f => {
    const feature = new GeoJSON(GEOJSON_CONFIG).readFeature(f);
    feature.setStyle(
      new Style({
        stroke: new Stroke({
          color: "blue",
          width: 2,
        }),
        // fill: new Fill({
        //   color: "rgba(255,0,0,0.2)",
        // }),
      })
    );
    return feature;
  });
  var seaLevelLayer = new VectorLayer({
    source: new VectorSource({
      features: slFeatures,
    }),
  });

  map.addLayer(seaLevelLayer);

  // Other stuff
  map.getView().setCenter(ol.proj.transform(blockGroupData.center || INITIAL_COORDS, "EPSG:4326", "EPSG:3857"));
  map.getView().setZoom(blockGroupData.zoom || INITIAL_ZOOM);

  console.log("Data Reference Descriptor: ");
  console.log(CENSUS_DESCRIPTORS[statName]);
  if (CENSUS_DESCRIPTORS[statName].totalReference) {
    console.log(CENSUS_DESCRIPTORS[CENSUS_DESCRIPTORS[statName].reference]);
    console.log(CENSUS_DESCRIPTORS[CENSUS_DESCRIPTORS[statName].totalReference]);
  }
}

// axios
//   .get("/static/data/counties_basemap.json")
//   .then(res => {
//     console.log("county basemap dl complete");
//     BASEMAP_DATA = res.data;
//     return axios.get("/static/data/counties.json");
//   })
//   .then(res => {
//     console.log("county map dl complete");
//     CENSUS_DATA = res.data;
//     renderLayers_counties();
//   })
//   .catch(e => console.log(e));

axios
  .get(`/static/data/${CURRENT_AREA}_block_groups.json`)
  .then(res => {
    console.log("block groups basemap dl complete");
    BASEMAP_DATA = res.data;
    return axios.get(`/static/data/${CURRENT_AREA}_block_groups_data.json`);
  })
  .then(res => {
    console.log("block groups data dl complete");
    CENSUS_DATA = res.data.blockGroups;
    CENSUS_DESCRIPTORS = res.data.references;
    return axios.get(`/static/data/${CURRENT_AREA}_sea_level_${CURRENT_SEA_LEVEL}.json`);
  })
  .then(res => {
    console.log("sea level data dl complete");
    SEA_LEVEL_DATA = res.data;
    renderLayers_block_groups();
  })
  .catch(e => console.log(e));
