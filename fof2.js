// Initialize the Cesium Viewer.

var viewer = new Cesium.Viewer('cesiumContainer', {

  terrain: Cesium.Terrain.fromWorldTerrain({

    requestVertexNormals: true

  })

});

viewer.scene.globe.enableLighting = true;

var osm = new Cesium.OpenStreetMapImageryProvider({

  url: 'https://tile.openstreetmap.org'

});

viewer.imageryLayers.addImageryProvider(osm);

async function loadTileset() {

  try {

    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(96188);

    viewer.scene.primitives.add(tileset);

  } catch (error) {

    console.log(`Error loading tileset: ${error}`);

  }

}

// Call the async function

loadTileset();

// Global base URL for the data service.

var baseUrl = "../";

// Global data source variables so we can update them.

var glotecDataSource;

var fof2DataSource;

var qsoDataSource;

// ------------------------------

// Methods to compute min/max values

// ------------------------------

// For Glotec (hmF2): Parse the number after "hmF2" in the _description._value field.

function getMaxHmF2() {

  if (!glotecDataSource) {

    return null;

  }

  let maxVal = -Infinity;

  glotecDataSource.entities.values.forEach(entity => {

    if (entity._description && entity._description._value) {

      // Regex to match "hmF2" followed by a number (which may include decimals)

      const match = /hmF2\s+([\d\.]+)/i.exec(entity._description._value);

      if (match && !isNaN(match[1])) {

        const value = parseFloat(match[1]);

        if (value > maxVal) {

          maxVal = value;

        }

      }

    }

  });

  return maxVal;

}

function getMinHmF2() {

  if (!glotecDataSource) {

    return null;

  }

  let minVal = Infinity;

  glotecDataSource.entities.values.forEach(entity => {

    if (entity._description && entity._description._value) {

      const match = /hmF2\s+([\d\.]+)/i.exec(entity._description._value);

      if (match && !isNaN(match[1])) {

        const value = parseFloat(match[1]);

        if (value < minVal) {

          minVal = value;

        }

      }

    }

  });

  return minVal;

}

// For FOF2: Parse the number after "hmF2" in the _description._value field.

function getMaxFof2() {

  if (!fof2DataSource) {

    return null;

  }

  let maxVal = -Infinity;

  fof2DataSource.entities.values.forEach(entity => {

    if (entity._description && entity._description._value) {

      const match = /f0f2\s+([\d\.]+)/i.exec(entity._description._value);

      if (match && !isNaN(match[1])) {

        const value = parseFloat(match[1]);

        if (value > maxVal) {

          maxVal = value;

        }

      }

    }

  });

  return maxVal;

}

function getMinFof2() {

  if (!fof2DataSource) {

    return null;

  }

  let minVal = Infinity;

  fof2DataSource.entities.values.forEach(entity => {

    if (entity._description && entity._description._value) {

      const match = /f0f2\s+([\d\.]+)/i.exec(entity._description._value);

      if (match && !isNaN(match[1])) {

        const value = parseFloat(match[1]);

        if (value < minVal) {

          minVal = value;

        }

      }

    }

  });

  return minVal;

}

// ------------------------------

// Global color scale used by both legends

// ------------------------------

var colorScale = [

  { rgba: [0, 0, 0, 255] },

  { rgba: [165, 42, 42, 255] },

  { rgba: [255, 0, 0, 255] },

  { rgba: [255, 165, 0, 255] },

  { rgba: [255, 255, 0, 255] },

  { rgba: [0, 128, 0, 255] },

  { rgba: [0, 0, 255, 255] },

  { rgba: [238, 130, 238, 255] },

  { rgba: [128, 128, 128, 255] },

  { rgba: [255, 255, 255, 255] }

];

// ------------------------------

// Legend builder function

// ------------------------------

// Now the legend panels are added as overlays on the map (viewer.container)

// instead of directly to the web page.

function buildLegend(containerId, minVal, maxVal, title) {

  var container = document.getElementById(containerId);

  if (!container) {

    container = document.createElement("div");

    container.id = containerId;

    container.className = "legendPanel";

    // Positioning: we offset each legend so they don't overlap.

    container.style.position = "absolute";

    container.style.backgroundColor = "rgba(42, 42, 42, 0.8)";

    container.style.padding = "10px";

    container.style.borderRadius = "5px";

    container.style.color = "white";

    container.style.zIndex = "1000";

    if (containerId === "legendHmF2") {

      container.style.right = "10px";

      container.style.bottom = "10px";

    } else if (containerId === "legendFof2") {

      container.style.right = "180px";

      container.style.bottom = "10px";

    }

    // Append the legend to the viewer container.

    viewer.container.appendChild(container);

  }

  // Clear previous legend content.

  container.innerHTML = "<strong>" + title + "</strong><br/>";

  var nColors = colorScale.length;

  var bucketSize = (maxVal - minVal) / nColors;

  for (var i = 0; i < nColors; i++) {

    var lowerBound = minVal + bucketSize * i;

    var upperBound = minVal + bucketSize * (i + 1);

    var rgba = colorScale[i].rgba;

    var cssColor =

      "rgba(" +

      rgba[0] +

      ", " +

      rgba[1] +

      ", " +

      rgba[2] +

      ", " +

      rgba[3] / 255 +

      ")";

    var row = document.createElement("div");

    row.style.display = "flex";

    row.style.alignItems = "center";

    row.style.marginBottom = "4px";

    var swatch = document.createElement("div");

    swatch.style.width = "20px";

    swatch.style.height = "20px";

    swatch.style.backgroundColor = cssColor;

    swatch.style.marginRight = "8px";

    var label = document.createElement("div");

    label.textContent =

      lowerBound.toFixed(1) + " - " + upperBound.toFixed(1);

    row.appendChild(swatch);

    row.appendChild(label);

    container.appendChild(row);

  }

}

// Update legends based on current checkbox selections and loaded data.

function updateLegends() {

  var glotecCheckbox = document.getElementById("toggleGlotec");

  if (glotecCheckbox.checked && glotecDataSource) {

    var minHmF2 = getMinHmF2();

    var maxHmF2 = getMaxHmF2();

    if (minHmF2 !== null && maxHmF2 !== null) {

      buildLegend("legendHmF2", minHmF2, maxHmF2, "hmF2 Legend");

      document.getElementById("legendHmF2").style.display = "block";

    }

  } else {

    var legendHmF2 = document.getElementById("legendHmF2");

    if (legendHmF2) legendHmF2.style.display = "none";

  }

  var fof2Checkbox = document.getElementById("toggleFof2");

  if (fof2Checkbox.checked && fof2DataSource) {

    var minFof2 = getMinFof2();

    var maxFof2 = getMaxFof2();

    if (minFof2 !== null && maxFof2 !== null) {

      buildLegend("legendFof2", minFof2, maxFof2, "FOF2 Legend");

      document.getElementById("legendFof2").style.display = "block";

    }

  } else {

    var legendFof2 = document.getElementById("legendFof2");

    if (legendFof2) legendFof2.style.display = "none";

  }

}

// ------------------------------

// Function to load or update the CZML layers.

// ------------------------------

function updateMap(minLat, maxLat, minLng, maxLng, startTs, endTs) {

  var glotecUrl = 'https://raw.githubusercontent.com/hcarter333/glotec_hm_fo_f2/refs/heads/main/hmf2.iczml';

  var fof2Url = 'https://raw.githubusercontent.com/hcarter333/glotec_hm_fo_f2/refs/heads/main/fof2.czml';

  console.debug("hmF2 " + glotecUrl);

  console.debug("fof2Url" + fof2Url);

  // Remove existing glotec and fof2 data sources (if any).

  if (glotecDataSource) {

    viewer.dataSources.remove(glotecDataSource, true);

  }

  if (fof2DataSource) {

    viewer.dataSources.remove(fof2DataSource, true);

  }

  // Load new data sources.

  Cesium.CzmlDataSource.load(glotecUrl).then(function (ds) {

    glotecDataSource = ds;

    viewer.dataSources.add(glotecDataSource);

    // Once loaded, update the legends.

    updateLegends();

  });

  Cesium.CzmlDataSource.load(fof2Url).then(function (ds) {

    fof2DataSource = ds;

    viewer.dataSources.add(fof2DataSource);

    updateLegends();

  });

}

// Initially load layers.

updateMap(0, 0, 0, 0, "", "");

// ------------------------------

// Create an overlay control panel on the Cesium map for layer toggling.

// ------------------------------

var layerPanel = document.createElement("div");

layerPanel.id = "layerControl";

layerPanel.style.position = "absolute";

layerPanel.style.top = "5px";

layerPanel.style.left = "5px";

layerPanel.style.backgroundColor = "rgba(42, 42, 42, 0.8)";

layerPanel.style.padding = "10px";

layerPanel.style.borderRadius = "5px";

layerPanel.style.zIndex = "1000";  // Ensure it's on top

layerPanel.innerHTML =

  '<label style="color:white;"><input id="toggleGlotec" type="checkbox" checked> hmF2 Map</label><br>' +

  '<label style="color:white;"><input id="toggleFof2" type="checkbox" checked> FOF2 Glotec Map</label>';

// Append the control panel to the viewer container.

viewer.container.appendChild(layerPanel);

// Listen for changes to the checkboxes and update the corresponding data sources.

document.getElementById("toggleGlotec").addEventListener("change", function (e) {

  if (glotecDataSource) {

    glotecDataSource.show = e.target.checked;

    updateLegends();

  }

});

document.getElementById("toggleFof2").addEventListener("change", function (e) {

  if (fof2DataSource) {

    fof2DataSource.show = e.target.checked;

  }

  updateLegends();

});
