//
var asset = 'projects/mapbiomas-argentina/assets/SECONDARY-VEGETATION-DEFORESTATION/COLLECTION-1/deforestacion-vegetacion-secundaria';
var assetOutput = 'projects/mapbiomas-argentina/assets/SECONDARY-VEGETATION-DEFORESTATION/COLLECTION-1/deforestacion-vegetacion-secundaria-ft';



var inputVersion = '0-24-0';
var outputVersion = '0-24-0';

var groupSize = 12; //1ha

var groupSizeException = 34; //3ha

var years = [
    1985, 1986,
    1987, 1988, 1989, 1990,
    1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998,
    1999, 2000, 2001, 2002,
    2003, 2004, 2005, 2006,
    2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018,
    2019, 2020, 2021, 2022,
    2023, 2024
];

var yearsException = [
    2024  // Cambiamos 
];

// product properties
var properties = {
    "description": "# Deforestación y vegetación secundaria\n" +
        "Versión con filtros espaciales de 2 ha acumulado con ajuste para el ultimo año\n" +
        "## 1. Descripción de los datos:\n " +
        "   * Version de integracón: " + inputVersion + "\n" +
        "   * Versión del producto: " + outputVersion + "\n",
    "version": outputVersion,
    "territory": "Argentina",
    "collection_id": 2.0,
    "source": "GT desmatamento",
    "theme": "Desmatamento"
};

var transitions = ee.ImageCollection(asset)
    .filter(ee.Filter.eq('version', inputVersion))
    .min();

print(transitions);

var visTransitions = {
    min: 0,
    max: 7,
    format: 'png',
    bands: 'classification_2024',
    palette: [
        '#ffffff', // [0] No data
        '#faf5d1', // [1] Antrópico
        '#3f7849', // [2] Veg. Primária
        '#5bcf20', // [3] Veg. Secundária
        '#ea1c1c', // [4] Supressão Veg. Primária
        '#b4f792', // [5] Recuperação para Veg. Secundária
        '#fe9934', // [6] Supressão Veg. Secundária
        '#303149', // [7] Outras transições
    ]
};

Map.addLayer(transitions, visTransitions, 'transitions');

var dfMask = years.map(
    function (year) {
        var band = 'classification_' + year.toString();

        var dfYear = transitions.select(band)
            .remap([4, 6], [1, 1], 0);

        return dfYear.rename(band);
    }
);

dfMask = ee.Image(dfMask).reduce(ee.Reducer.anyNonZero());

var svMask = years.map(
    function (year) {
        var band = 'classification_' + year.toString();

        var svYear = transitions.select(band)
            .remap([3, 5], [1, 1], 0);

        return svYear.rename(band);
    }
);

svMask = ee.Image(svMask).reduce(ee.Reducer.max());

var dfMaskException = yearsException.map(
    function (year) {
        var band = 'classification_' + year.toString();

        var dfYear = transitions.select(band)
            .remap([4, 6], [1, 1], 0);

        return dfYear.rename(band);
    }
);

dfMaskException = ee.Image(dfMaskException).reduce(ee.Reducer.anyNonZero());
//
var dfConnected = dfMask.selfMask()
    .connectedPixelCount({
        maxSize: 100,
        eightConnected: true
    });

var svConnected = svMask.selfMask()
    .connectedPixelCount({
        maxSize: 100,
        eightConnected: true
    });

var dfConnectedException = dfMaskException.selfMask()
    .connectedPixelCount({
        maxSize: 100,
        eightConnected: true
    });
//

var transitionsFt = transitions;

transitionsFt = transitionsFt.where(dfConnected.lte(groupSize).and(transitionsFt.eq(4)), 7)
transitionsFt = transitionsFt.where(dfConnected.lte(groupSize).and(transitionsFt.eq(6)), 7)
transitionsFt = transitionsFt.where(svConnected.lte(groupSize).and(transitionsFt.eq(3)), 7)
transitionsFt = transitionsFt.where(svConnected.lte(groupSize).and(transitionsFt.eq(5)), 7);

// Apply exceptions for last years
var transitionsException = yearsException.map(
    function (year) {
        var band = 'classification_' + year.toString();

        var transitionsYear = transitionsFt.select(band);

        transitionsYear = transitionsYear.where(dfConnectedException.lte(groupSizeException).and(transitionsYear.eq(4)), 7);
        transitionsYear = transitionsYear.where(dfConnectedException.lte(groupSizeException).and(transitionsYear.eq(6)), 7);

        return transitionsYear;
    }
);

transitionsException = ee.Image(transitionsException);

print('transitionsException', transitionsException);

Map.addLayer(transitionsFt, visTransitions, 'transitions ft');
Map.addLayer(transitionsException, visTransitions, 'transitions Exception');

// add transitions exception to bands
transitionsFt = transitionsFt.addBands(transitionsException, null, true);

Map.addLayer(dfConnected.gte(groupSize).selfMask(), {
    min: 0,
    max: 1,
    format: 'png',
    palette: [
        '#0c003d',
        '#000000',
    ]
},
    "dfConnected",
    false,
    0.4
);

Map.addLayer(svConnected.gte(groupSize).selfMask(), {
    min: 0,
    max: 1,
    format: 'png',
    palette: [
        '#0c003d',
        '#000000',
    ]
},
    "svConnected",
    false,
    0.4
);

//
var assetGrids = 'projects/mapbiomas-chaco/BASE/cartas-argentina';

var grids = ee.FeatureCollection(assetGrids);

var gridNames = [
  "SE-20",  "SE-21",  "SF-19",  "SF-20",  "SF-21",  "SG-19",  "SG-20",
  "SG-21",  "SG-22",  "SH-19",  "SH-20",  "SH-21",  "SI-19",  "SI-20",
  "SI-21",  "SJ-19",  "SJ-20",  "SJ-21",  "SK-18",  "SK-19",  "SK-20",
  "SL-18",  "SL-19",  "SL-20",  "SM-18",  "SM-19",  "SM-20",  "SN-19",
  "SN-20"
]


gridNames.forEach(
    function (gridName) {
        var grid = grids.filter(ee.Filter.stringContains('grid_name', gridName))

        Export.image.toAsset({
            image: transitionsFt.set(properties),
            description: gridName + "-" + outputVersion,
            assetId: assetOutput + "/" + gridName + "-" + outputVersion,
            pyramidingPolicy: {
                '.default': 'mode'
            },
            region: grid.geometry().buffer(300).bounds(),
            scale: 30,
            maxPixels: 1e13
        });
    }
);