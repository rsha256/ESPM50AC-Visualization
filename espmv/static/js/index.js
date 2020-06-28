const Feature = ol.Feature;
const Map = ol.Map;
const View = ol.View;
const GeoJSON = ol.format.GeoJSON;
const Circle = ol.geom.Circle;
const { Tile: TileLayer, Vector: VectorLayer } = ol.layer;
const { OSM, Vector: VectorSource } = ol.source;
const { Circle: CircleStyle, Fill, Stroke, Style } = ol.style;

const GEOJSON_CONFIG = {
  featureProjection: "EPSG:3857",
  dataProjection: "EPSG:4326",
};
const INITIAL_COORDS = [-119.6, 36.6];
const INITIAL_ZOOM = 6;
const BASE_LAYER = new TileLayer({
  source: new OSM(),
});

let COUNTIES_BASEMAP_DATA, COUNTIES_DATA;
let CURRENT_STAT = "population";

const map = new Map({
  layers: [BASE_LAYER],
  target: "mainMap",
});
map.getView().setCenter(ol.proj.transform(INITIAL_COORDS, "EPSG:4326", "EPSG:3857"));
map.getView().setZoom(INITIAL_ZOOM);

var getStyleForFeature = function (feature) {
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
};

function renderLayers() {
  map.getLayers().forEach(layer => map.removeLayer(layer));
  map.addLayer(BASE_LAYER);

  const countiesData = COUNTIES_BASEMAP_DATA;

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
    return feature;
  });

  var vectorLayer = new VectorLayer({
    source: new VectorSource({ features }),
    style: getStyleForFeature,
  });

  map.addLayer(vectorLayer);
}

axios
  .get("/static/data/counties_basemap.json")
  .then(res => {
    console.log("county basemap dl complete");
    COUNTIES_BASEMAP_DATA = res.data;
    return axios.get("/static/data/counties.json");
  })
  .then(res => {
    console.log("county map dl complete");
    COUNTIES_DATA = res.data;
    renderLayers();
  })
  .catch(e => console.log(e));
