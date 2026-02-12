/**
 * 
 */
// import modules
// var palette = require('users/mapbiomas/modules:Palettes.js').get('classification9');

// assets
var assetInput = 'projects/mapbiomas-argentina/assets/LAND-COVER/COLLECTION-2/INTEGRATION/mapbiomas_argentina_collection1_integration_v8';
var assetOutput = 'projects/mapbiomas-argentina/assets/SECONDARY-VEGETATION-DEFORESTATION/COLLECTION-1/deforestacion-vegetacion-secundaria';

// product versions
var inputVersion = '0-24';
var outputVersion = '0-24-0';


var mapbiomasPalette = [];
for (var i = 0; i < 78; i++) { mapbiomasPalette.push('#000000'); } // color "fallback"

// Asignar colores a los códigos que usamos
mapbiomasPalette[3]  = '#1f8d49';  // Bosques cerrados
mapbiomasPalette[4]  = '#7dc975';  // Bosques abiertos
mapbiomasPalette[6]  = '#026975';  // Bosques inundables

mapbiomasPalette[66] = '#a89358';  // Arbustales cerrados
mapbiomasPalette[12] = '#d6bc74';  // Pastizales
mapbiomasPalette[11] = '#519799';  // Herbáceas inundables
mapbiomasPalette[63] = '#ebf8b5';  // Mosaico arbustos y herbáceas
mapbiomasPalette[73] = '#6fc179';  // Turberas

mapbiomasPalette[19] = '#C27BA0';  // Cultivos temporarios
mapbiomasPalette[36] = '#d082de';  // Cultivos perennes
mapbiomasPalette[15] = '#edde8e';  // Pasturas
mapbiomasPalette[9]  = '#7a5900';  // Leñosas cultivadas
mapbiomasPalette[21] = '#ffefc3';  // Mosaico de Usos

mapbiomasPalette[24] = '#d4271e';  // Áreas Urbanas
mapbiomasPalette[25] = '#db4d4f';  // Otras no vegetadas

mapbiomasPalette[33] = '#2532e4';  // Ríos, lagos, océano
mapbiomasPalette[34] = '#93dfe6';  // Hielo y nieve
mapbiomasPalette[27] = '#ffffff';  // No observado

//fALTAN
mapbiomasPalette[77] = '#a89358';  // Arbustales abiertos

var palette = mapbiomasPalette


//
var yearVis = 2022;

//
var years = [
    1985, 1986, 1987, 1988,
    1989, 1990, 1991, 1992,
    1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000,
    2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008,
    2009, 2010, 2011, 2012,
    2013, 2014, 2015, 2016,
    2017, 2018, 2019, 2020,
    2021, 2022, 2023, 2024
];

// 2021: (2020 + 1), 2022: (2020 + 2), 2023: (2020 + 3)
var yearsEnd = [
    2021,  // Cambiamos 
];

// [1] Antrópico
// [2] Veg.Primária
// [3] Veg.Secundária
// [4] Supressão Veg.Primária
// [5] Recuperação para Veg.Secundária
// [6] Supressão Veg.Secundária
// [7] Outras transições

var rules = [
    // [4] Supressão Veg.Primária
    [[2, 2, 1, 1], [2, 2, 4, 1]],
];

var rulesEnd = [
    // [4] Supressão Veg.Primária
    // como não há a confirmação após o desmatamento,
    // usamos 3 anos previos de vegetação primaria
    // para reduzir os ruídos
    [[2, 2, 2, 1], [2, 2, 2, 4]],
    [[3, 3, 3, 1], [3, 3, 3, 6]],
];

var rulesSecVeg = [
    // 
    [[1, 2, 2, 2], [1, 5, 3, 3]],
    [[5, 3, 3, 2], [5, 3, 3, 3]],
    [[3, 2, 2, 2], [3, 3, 3, 3]],
    [[3, 2, 2, 4], [3, 3, 3, 4]],
    [[3, 3, 2, 4], [3, 3, 3, 6]],
    [[3, 3, 2, 2], [3, 3, 3, 3]],
    [[3, 3, 3, 2], [3, 3, 3, 3]],
    [[1, 2, 2, 4], [1, 1, 1, 1]],
];

var rulesDefSecVeg = [
    // 
    [[3, 4, 1], [3, 6, 1]],
];

/**
 * [mapbiomas_id, aggregation_id]
 * Aggregated ids
 * 0 - Ignorado
 * 1 - Antrópico
 * 2 - Vegetação
 */
 

var classes = [
    [3,  2], //.1. Forest Formation
    [4,  2], //.2. Savanna Formation
    [6,  2], //.4 Floodable Forest (aplicar para alguns biomas)
    [66, 2], //1.5. Wooded Sandbank Vegetation
    [73, 2], //2. Non Forest Natural Formation
    [77, 2], //2. Non Forest Natural Formation
    [63, 2], //2. Non Forest Natural Formation
    [11, 2], //2.1. Wetland (aplicar para alguns biomas)
    [12, 2], //2.2. Grassland
    
    [15, 1], //3.1. Pasture
    [19, 1], //3.2.1. Temporary Crop
    [36, 1], //3   Frutales, Arandano,  olivo...
    [9,  1], //.3. Forest Plantation
    [21, 1], //3.4. Mosaic of Uses
    [24, 1], //4.2. Urban Area
    
    [25, 7], //4.4. Other non Vegetated Areas
    [34, 7], //Hielo y Nieve
    [33, 7], //5.1. River, Lake and Ocean
    
    [27, 0], //6. Not Observed
];


//
var integrated = ee.Image(assetInput)
    // .filter(ee.Filter.eq('version', inputVersion))
    // .min();

// get input lookup
var lookupIn = classes.map(
    function (c) {
        return c[0];
    }
);

// get output lookup
var lookupOut = classes.map(
    function (c) {
        return c[1];
    }
);

/**
 * 
 * @param {ee.Image} classification 
 * @param {List} yearsList 
 * @param {List} inputClasses 
 * @param {List} outputClasses 
 * @returns  ee.ImageCollection
 */
var aggregateClasses = function (classification, lookupIn, lookupOut) {

    var bandNames = classification.bandNames();

    var remapedImages = bandNames
        .iterate(
            function (band, image) {

                band = ee.String(band);

                var remaped = classification
                    .select(band)
                    .remap(lookupIn, lookupOut, 0)
                    .rename(band);

                return ee.Image(image).addBands(remaped);
            },
            ee.Image().select()
        );

    return ee.Image(remapedImages);
};

/**
 * 
 */
var classificationAgg = aggregateClasses(integrated, lookupIn, lookupOut);

print(classificationAgg);

/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getDeforestation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};


/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getSecondaryVegetation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};

/**
 * 
 * @param {*} year 
 * @param {*} classificationFtd 
 * @returns 
 */
var getDeforestationInSecondaryVegetation = function (rule, obj) {

    rule = ee.List(rule);
    obj = ee.Dictionary(obj);

    var classification = ee.Image(obj.get('classification'));
    var years = ee.List(obj.get('years'));

    // iterate over exceptions list and apply the filter function
    classification = years.iterate(
        /**
         * 
         * @param {*}  
         * @param {*}  
         * @returns 
         */
        function (year, classification) {

            classification = ee.Image(classification);
            year = ee.Number(year).int16();

            var b1 = ee.String('classification_').cat(ee.String(year));
            var b2 = ee.String('classification_').cat(ee.String(year.add(1)));
            var b3 = ee.String('classification_').cat(ee.String(year.add(2)));
            // var b4 = ee.String('classification_').cat(ee.String(year.add(3)));

            var t1 = classification.select(b1);
            var t2 = classification.select(b2);
            var t3 = classification.select(b3);
            // var t4 = classification.select(b4);

            var kernelBef = ee.List(ee.List(rule).get(0));
            var kernelAft = ee.List(ee.List(rule).get(1));

            // cb - class before, ca - class after
            var cb1 = ee.Number(kernelBef.get(0));
            var cb2 = ee.Number(kernelBef.get(1));
            var cb3 = ee.Number(kernelBef.get(2));
            // var cb4 = ee.Number(kernelBef.get(3));

            var ca1 = ee.Number(kernelAft.get(0));
            var ca2 = ee.Number(kernelAft.get(1));
            var ca3 = ee.Number(kernelAft.get(2));
            // var ca4 = ee.Number(kernelAft.get(3));

            // detects deforestation
            // var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3)).and(t4.eq(cb4));
            var mask1 = t1.eq(cb1).and(t2.eq(cb2)).and(t3.eq(cb3));

            t1 = t1.where(mask1, ca1);
            t2 = t2.where(mask1, ca2);
            t3 = t3.where(mask1, ca3);
            // t4 = t4.where(mask1, ca4);

            classification = classification.addBands(t1, null, true);
            classification = classification.addBands(t2, null, true);
            classification = classification.addBands(t3, null, true);
            // classification = classification.addBands(t4, null, true);

            return classification;

        }, classification
    );

    classification = ee.Image(classification);

    // update obj
    obj = obj.set('classification', classification);

    return obj;
};

/**
 * 
 * @param {*} image 
 * @param {*} classId 
 */
var getClassFrequency = function (image, classId) {

    var bandNames = image.bandNames();

    var freq = bandNames.slice(1)
        .iterate(
            function (band, imageFreq) {
                var mask = image.select([band]).eq(classId);

                var currentNames = ee.Image(imageFreq).bandNames();

                var lastFreq = ee.Image(imageFreq)
                    .select([currentNames.reverse().get(0)]);

                var newFreq = lastFreq.add(mask)
                    .rename([band]);

                return ee.Image(imageFreq).addBands(newFreq);
            },
            image.select([0]).eq(classId)
        );

    return ee.Image(freq);
};

/**
 * iterates over biomes and applies rules
 */
// 1. detect deforestation
var obj = ee.List(rules)
    .iterate(
        getDeforestation,
        {
            'classification': classificationAgg,
            'years': ee.List(years).slice(0, years.length - 3)
        }
    );

obj = ee.Dictionary(obj);

var transitions = ee.Image(obj.get('classification'));

// 2. detect secondary vegetation
obj = ee.List(rulesSecVeg)
    .iterate(
        getSecondaryVegetation,
        {
            'classification': transitions,
            'years': ee.List(years).slice(0, years.length - 3)
        }
    );

obj = ee.Dictionary(obj);

transitions = ee.Image(obj.get('classification'));

// 2. detect secondary vegetation
obj = ee.List(rulesDefSecVeg)
    .iterate(
        getDeforestationInSecondaryVegetation,
        {
            'classification': transitions,
            'years': ee.List(years).slice(0, years.length - 2) // kernel size == 3
        }
    );

obj = ee.Dictionary(obj);

transitions = ee.Image(obj.get('classification'));

// 1. detect deforestation in the last year
var obj = ee.List(rulesEnd)
    .iterate(
        getDeforestation,
        {
            'classification': transitions,
            'years': yearsEnd
        }
    );

obj = ee.Dictionary(obj);

var transitions = ee.Image(obj.get('classification'));
//
//
var anthropicFreq = getClassFrequency(classificationAgg, 1);
// var vegetationAge = getClassFrequency(classificationAgg, 2);

// Regras gerais
transitions = transitions.where(anthropicFreq.gt(1).and(transitions.eq(4)), 6);
transitions = transitions.where(anthropicFreq.gt(0).and(transitions.eq(2)), 3);

// var transitions2020 = transitions.select('classification_2020');
var transitions2021 = transitions.select('classification_2021');
var transitions2022 = transitions.select('classification_2022');
var transitions2023 = transitions.select('classification_2023');

// ajusta ultimos anos da vegetação secundária não confirmada
transitions2022 = transitions2022.where(transitions2021.eq(1).and(transitions2022.eq(3)), 1);
transitions2023 = transitions2023.where(transitions2021.eq(1).and(transitions2023.eq(3)), 1);
transitions2023 = transitions2023.where(transitions2022.eq(1).and(transitions2023.eq(3)), 1);

// ajusta o último ano do desmatamento não confirmado em vegetação sencundária
transitions2023 = transitions2023.where(transitions2022.eq(3).and(transitions2023.eq(1)), 3);

transitions = transitions.addBands(transitions2022, null, true);
transitions = transitions.addBands(transitions2023, null, true);

var transitionsPalette = [
    '#ffffff', // [0] No data
    '#faf5d1', // [1] Antrópico
    '#3f7849', // [2] Veg. Primária
    '#5bcf20', // [3] Veg. Secundária
    '#ea1c1c', // [4] Supressão Veg. Primária
    '#b4f792', // [5] Recuperação para Veg. Secundária
    '#fe9934', // [6] Supressão Veg. Secundária
    '#303149', // [7] Outras transições
];

//
Map.addLayer(anthropicFreq, {
    'min': 0,
    'max': 39,
    // 'palette': palette,
    'format': 'png'
}, 'anthropic frequency', false);

Map.addLayer(integrated, {
    'bands': ['classification_' + yearVis.toString()],
    'min': 0,
    'max': 69,
    'palette': palette,
    'format': 'png'
}, 'classification', false);

Map.addLayer(transitions, {
    'bands': ['classification_' + yearVis.toString()],
    'min': 0,
    'max': 7,
    'palette': transitionsPalette,
    'format': 'png'
}, 'transitions');

// product properties
var properties = {
    "description": "# Desmatamento e Vegetação Secundária\n" +
        "## 1. Descrição do dado\n " +
        "### Versão da integração: " + inputVersion + "\n" +
        "* Versão do produto: " + outputVersion + "\n" +
        "* Detalhes do produto: c9-v" + inputVersion + "-" + outputVersion + "\n",
    "version": outputVersion,
    "territory": "BRAZIL",
    "collection_id": 9.0,
    "source": "GT desmatamento",
    "theme": "Desmatamento"
};

/**
 * Export to asset
 */
var gridNames = [
  "SE-20",  "SE-21",  "SF-19",  "SF-20",  "SF-21",  "SG-19",  "SG-20",
  "SG-21",  "SG-22",  "SH-19",  "SH-20",  "SH-21",  "SI-19",  "SI-20",
  "SI-21",  "SJ-19",  "SJ-20",  "SJ-21",  "SK-18",  "SK-19",  "SK-20",
  "SL-18",  "SL-19",  "SL-20",  "SM-18",  "SM-19",  "SM-20",  "SN-19",
  "SN-20"
]


var assetGrids = 'projects/mapbiomas-chaco/BASE/cartas-argentina';

var grids = ee.FeatureCollection(assetGrids);

gridNames.forEach(
    function (gridName) {
        var grid = grids.filter(ee.Filter.stringContains('grid_name', gridName));

        Export.image.toAsset({
            image: transitions.set(properties),
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
/**
 * 
 */
var Chart = {

    options: {
        'title': 'Inspector',
        'legend': 'none',
        'chartArea': {
            left: 30,
            right: 2,
        },
        'titleTextStyle': {
            color: '#ffffff',
            fontSize: 10,
            bold: true,
            italic: false
        },
        'tooltip': {
            textStyle: {
                fontSize: 10,
            },
            // isHtml: true
        },
        'backgroundColor': '#21242E',
        'pointSize': 6,
        'crosshair': {
            trigger: 'both',
            orientation: 'vertical',
            focused: {
                color: '#dddddd'
            }
        },
        'hAxis': {
            // title: 'Date', //muda isso aqui
            slantedTextAngle: 90,
            slantedText: true,
            textStyle: {
                color: '#ffffff',
                fontSize: 8,
                fontName: 'Arial',
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                fontName: 'Arial',
                bold: true,
                italic: false
            },
            viewWindow: {
                max: 39,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 1
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'vAxis': {
            title: 'Class', // muda isso aqui
            textStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            titleTextStyle: {
                color: '#ffffff',
                fontSize: 10,
                bold: false,
                italic: false
            },
            viewWindow: {
                max: 62,
                min: 0
            },
            gridlines: {
                color: '#21242E',
                interval: 2
            },
            minorGridlines: {
                color: '#21242E'
            }
        },
        'lineWidth': 0,
        // 'width': '300px',
        'height': '150px',
        'margin': '0px 0px 0px 0px',
        'series': {
            0: { color: '#21242E' }
        },

    },

    assets: {
        image: integrated,
        imagef: transitions
    },

    data: {
        image: null,
        imagef: null,
        point: null
    },

     // Bosques cerrados             [3]  
// Bosques abiertos[4]  
// Bosques inundables[6]  
// Arbustales cerrados[66] 
// Pastizales[12] 
// Herbáceas inundables[11] 
// Mosaico arbustos y herbáceas[63] 
// Turberas[75] 
// Cultivos temporarios[19] 
// Cultivos perennes[36] 
// Pasturas[15] 
// Leñosas cultivadas[9]  
// Mosaico de Usos[21] 
// Áreas Urbanas[24] 
// Otras no vegetadas[25] 
// Ríos, lagos, océano[33] 
// Hielo y nieve[34] 
// No observado[27] 
    legend: {
        // 0: { 'color': palette[0], 'name': 'Ausência de dados' },
        3: { 'color': palette[3], 'name': 'Bosques Cerrados' },
        4: { 'color': palette[4], 'name': 'Bosques Abiertos' },
        // 5: { 'color': palette[5], 'name': 'Mangue' },
        6: { 'color': palette[6], 'name': 'Bosques Inundables' },
        // 49: { 'color': palette[49], 'name': 'Restinga Florestal' },
        11: { 'color': palette[11], 'name': 'Herbaceas Inundables' },
        12: { 'color': palette[12], 'name': 'Herbaceas' },
        // 32: { 'color': palette[32], 'name': 'Apicum' },
        // 29: { 'color': palette[29], 'name': 'Afloramento Rochoso' },
        // 50: { 'color': palette[50], 'name': 'Restinga Herbácea/Arbustiva' },
        // 13: { 'color': palette[13], 'name': 'Outra Formação não Florestal' },
        15: { 'color': palette[15], 'name': 'Pasturas' },
        // 18: { 'color': palette[18], 'name': 'Agricultura' },
        19: { 'color': palette[19], 'name': 'Cultivos Temporarios' },
        36: { 'color': palette[36], 'name': 'Cultivos perennes' },
        // 39: { 'color': palette[39], 'name': 'Soja' },
        // 20: { 'color': palette[20], 'name': 'Cana' },
        // 40: { 'color': palette[40], 'name': 'Arroz' },
        // 62: { 'color': palette[62], 'name': 'Algodão' },
        // 41: { 'color': palette[41], 'name': 'Outras Lavouras Temporárias' },
        // 46: { 'color': palette[46], 'name': 'Café' },
        // 47: { 'color': palette[47], 'name': 'Citrus' },
        // 48: { 'color': palette[48], 'name': 'Otros Cultivos Perennes' },
        // 35: { 'color': palette[35], 'name': 'Palma' },
        9:  { 'color': palette[9], 'name': 'Silvicultura' },
        21: { 'color': palette[21], 'name': 'Mosaico de Usos, Áreas abandonadas' },
        // 22: { 'color': palette[22], 'name': 'Área não Vegetada' },
        // 23: { 'color': palette[23], 'name': 'Playas y Dunas' },
        24: { 'color': palette[24], 'name': 'Infraestrutura Urbana' },
        25: { 'color': palette[25], 'name': 'Otras no vegetadas' },
        // 61: { 'color': palette[61], 'name': 'Salares' },
        // 30: { 'color': palette[30], 'name': 'Mineração' },
        // 25: { 'color': palette[25], 'name': 'Otras Areas No Vegetadas' },
        33: { 'color': palette[33], 'name': 'Rios, lagunas, lagos y oceanos' },
        34: { 'color': palette[34], 'name': 'Hielo y nieve' },
        63: { 'color': palette[63], 'name': 'Mosaico de Arbustos y herbaceas' },
        66: { 'color': palette[66], 'name': 'Matorrales y arbustales Cerrados' },
        73: { 'color': palette[73], 'name': 'Turberas' },
        77: { 'color': palette[77], 'name': 'Matorrales y arbustales Abiertos' }
        
    },

    legendDeforestation: {
        0: { 'color': transitionsPalette[0], 'name': 'Sem informação' },
        1: { 'color': transitionsPalette[1], 'name': 'Antrópico' },
        2: { 'color': transitionsPalette[2], 'name': 'Veg. Primária' },
        3: { 'color': transitionsPalette[3], 'name': 'Veg. Secundária' },
        4: { 'color': transitionsPalette[4], 'name': 'Supressão Veg. Primária' },
        5: { 'color': transitionsPalette[5], 'name': 'Recuperação para Veg. Secundária' },
        6: { 'color': transitionsPalette[6], 'name': 'Supressão Veg. Secundária' },
        7: { 'color': transitionsPalette[7], 'name': 'Outras transições' },
    },

    loadData: function () {
        Chart.data.image = integrated;
        Chart.data.imagef = transitions;
    },

    init: function () {
        Chart.loadData();
        Chart.ui.init();
    },

    getSamplePoint: function (image, points) {

        var sample = image.sampleRegions({
            'collection': points,
            'scale': 30,
            'geometries': true,
            'tileScale': 8
        });

        return sample;
    },

    ui: {

        init: function () {

            Chart.ui.form.init();
            Chart.ui.activateMapOnClick();

        },

        activateMapOnClick: function () {

            Map.onClick(
                function (coords) {
                    var point = ee.Geometry.Point(coords.lon, coords.lat);

                    var bandNames = Chart.data.image.bandNames();

                    var newBandNames = bandNames.map(
                        function (bandName) {
                            var name = ee.String(ee.List(ee.String(bandName).split('_')).get(1));

                            return name;
                        }
                    );

                    var image = Chart.data.image.select(bandNames, newBandNames);
                    var imagef = Chart.data.imagef.select(bandNames, newBandNames);

                    Chart.ui.inspect(Chart.ui.form.chartInspectorf, imagef, point, 1.0, Chart.legendDeforestation);
                    Chart.ui.inspect(Chart.ui.form.chartInspector, image, point, 1.0, Chart.legend);

                    Chart.ui.form.labelCoords.setValue(coords.lon.toString() + ',' + coords.lat.toString());
                }
            );

            Map.style().set('cursor', 'crosshair');
        },

        refreshGraph: function (chart, sample, opacity, legend) {

            sample.evaluate(
                function (featureCollection) {

                    if (featureCollection.features !== null | featureCollection.features !== undefined) {
                        print("FF",featureCollection);

                        var pixels = featureCollection.features.map(
                            function (features) {
                                return features.properties;
                            }
                        );

                        var bands = Object.getOwnPropertyNames(pixels[0]);

                        // Add class value
                        var dataTable = bands.map(
                            function (band) {
                                var value = pixels.map(
                                    function (pixel) {
                                        return pixel[band];
                                    }
                                );

                                return [band].concat(value);
                            }
                        );

                        // Add point style and tooltip
                        dataTable = dataTable.map(
                            function (point) {
                                var color = legend[point[1]].color;
                                var name = legend[point[1]].name;
                                var value = String(point[1]);

                                var style = 'point {size: 4; fill-color: ' + color + '; opacity: ' + opacity + '}';
                                var tooltip = 'year: ' + point[0] + ', class: [' + value + '] ' + name;

                                return point.concat(style).concat(tooltip);
                            }
                        );

                        var headers = [
                            'serie',
                            'id',
                            { 'type': 'string', 'role': 'style' },
                            { 'type': 'string', 'role': 'tooltip' }
                        ];

                        dataTable = [headers].concat(dataTable);

                        chart.setDataTable(dataTable);

                    }
                }
            );
        },

        refreshMap: function () {

            var pointLayer = Map.layers().filter(
                function (layer) {
                    return layer.get('name') === 'Point';
                }
            );

            if (pointLayer.length > 0) {
                Map.remove(pointLayer[0]);
                Map.addLayer(Chart.data.point, { color: 'yellow' }, 'Point');
            } else {
                Map.addLayer(Chart.data.point, { color: 'yellow' }, 'Point');
            }

        },

        inspect: function (chart, image, point, opacity, legend) {

            // aqui pode fazer outras coisas além de atualizar o gráfico
            Chart.data.point = Chart.getSamplePoint(image, ee.FeatureCollection(point));

            Chart.ui.refreshMap(Chart.data.point);
            Chart.ui.refreshGraph(chart, Chart.data.point, opacity, legend);

        },

        form: {

            init: function () {

                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspector);
                Chart.ui.form.panelChart.add(Chart.ui.form.chartInspectorf);
                Chart.ui.form.panelChart.add(Chart.ui.form.labelCoords);


                Chart.options.title = 'Integrated';
                Chart.ui.form.chartInspector.setOptions(Chart.options);

                Chart.options.title = 'Deforestation/Regeneration';
                Chart.options.vAxis.viewWindow.max = 7;
                Chart.ui.form.chartInspectorf.setOptions(Chart.options);

                Map.add(Chart.ui.form.panelChart);
            },

            labelCoords: ui.Label({
                'style': {
                    'padding': '0px',
                    'backgroundColor': '#21242E',
                    'color': '#FFFFFF',
                    'fontSize': '10px'
                },
            }),

            panelChart: ui.Panel({
                'layout': ui.Panel.Layout.flow('vertical'),
                'style': {
                    'width': '450px',
                    // 'height': '200px',
                    'position': 'bottom-right',
                    'margin': '0px 0px 0px 0px',
                    'padding': '0px',
                    'backgroundColor': '#21242E'
                },
            }),

            chartInspector: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            ]),

            chartInspectorf: ui.Chart([
                ['Serie', ''],
                ['', -1000], // número menor que o mínimo para não aparecer no gráfico na inicialização
            ])
        }
    }
};

Chart.init();