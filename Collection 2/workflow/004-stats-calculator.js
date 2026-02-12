/**
 *  Script de calculo de estadisticas por vector 
 *  
 *  Este script viene de MB Bolivia y se modifico bastante para el cálculo de 
 *  estadisticas de manera eficiente. Tenía demasiadas operaciones cliente-side que lo volvian 
 *  muy inestable o con limitaciones que generaban de error de payload.
 *  
 *  Banchero, Santiago  
 *  17/09/2025
 * */


var path_producto = "projects/mapbiomas-argentina/assets/SECONDARY-VEGETATION-DEFORESTATION/COLLECTION-1/perdida-de-vegetacion-y-veg-sec-argentina-c2"
var col2ArgDegVegSec = ee.Image(path_producto)

var years = ee.List.sequence(1985,2024).getInfo();
// var years = ee.List.sequence(2015,2024).getInfo();
var Range =''
// var Range = '2005_2024'
// var Range = '1985_1994'
// var Range = '1995_2004'
// var Range = '2005_2014'
// var Range = '2015_2024'
// var Range = '1985_2004'
var Range = ''

//  Territorios: Nombres de los assets de vectores y rasters
//-------------------------------------------------------------
var name = 'Stats-Arg_political_level_3_v';
var nameRas = "Stats-Arg_political_level_3_r"
var territoryName = 'LEVEL_3' // Atributo Name
//-------------------------------------------------------------

var unidad = 1e4 // 1e4 hectareas ; 1e6 km2
var LimVec = ee.FeatureCollection('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/VECTOR/ARG/'+name)
var LimRas = ee.Image('projects/mapbiomas-argentina/assets/ANCILLARY_DATA/RASTER/ARG/'+nameRas)

// Verificacion de los assets: Asegurarse que los GEOCODE esten iguales en rasters y vectores 
print('LimVec',  LimVec)
print('LimRas',  LimRas)
print('col2ArgDegVegSec', col2ArgDegVegSec)

// Ajustamos el resutlao de PROTECTED_AREA_SUBNATIONAL
if (name=='PROTECTED_AREA_SUBNATIONAL'){
  LimVec = LimVec.filter('GEOCODE!=85')
}


function getAreasV2(image, region,regionRas,geoc) {
    var Year;
    var mes;
    function convert2featCollection(item) {
        item = ee.Dictionary(item);
        var feature = ee.Feature(null)
            .set('Id_clase', item.get('classe'))
            .set("area_ha", ee.Number(item.get('sum')).divide(unidad))
            .set("cobertura", name)
            .set("year", Year)
            .set("geocode", geoc)
            .set('Name',NombreTerr)
        return feature;
    }
    var pixelArea = ee.Image.pixelArea()
    pixelArea = pixelArea.mask(regionRas).selfMask();
    
    var StatsArea = ee.FeatureCollection([])
    var reducer, regions,img;
    reducer = ee.Reducer.sum().group(1, 'classe').group(1, 'featureid');
    regions = regionRas.gt(0);
     
    // Empezamos a recorrer el ciclo 
    years.forEach(function(year){
      Year = year;
      var areas = pixelArea.addBands(regions).addBands(image.select('classification_'+year))
          .reduceRegion({
              reducer: reducer,
              //geometry: AOI,
              geometry:region.geometry().bounds(),
              // geometry:AOI,
              scale: 30,
              maxPixels: 1e13
          });
      
      areas = ee.FeatureCollection(
          ee.List(ee.Dictionary(ee.List(areas.get('groups')).get(0)).get('groups'))
          .map(convert2featCollection)
      );
      // print(areas)
      StatsArea = StatsArea.merge(areas)
    })
    
    return StatsArea
}

var ListaIds = LimVec.aggregate_array('GEOCODE')
var Reg,Reg_ras,ImgTarget,NameExport,nameStats;
var YearGen=1985;
var geocode=0;
var Drive= 'Stat-Col2-MapBiomasArgentina'
var NombreTerr;

var calc = function(Id){
  Reg = LimVec.filter(ee.Filter.eq('GEOCODE',Id))
  NombreTerr = Reg.first().get(territoryName) 
  Reg_ras=LimRas.eq(ee.Number(Id)).selfMask();
  ImgTarget = col2ArgDegVegSec.mask(Reg_ras).selfMask();
  var ic = getAreasV2(ImgTarget, Reg, Reg_ras, Id)
  return ee.Algorithms.If(ic.size().neq(0),ic.toList(ic.size()),ee.List([]))
}

var resStats = ee.FeatureCollection(ListaIds.map(calc).flatten())

//  
nameStats = name+'_stats'
Export.table.toDrive({
    collection:resStats, 
    description:nameStats + '_' + "col2ArgDegVegSec", 
    folder:Drive,
    fileNamePrefix:nameStats + '_' + Range, 
    fileFormat:'CSV', 
  })


Map.addLayer(LimVec,{},name)
Map.addLayer(LimRas,{},nameRas)


