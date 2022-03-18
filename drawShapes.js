function current_position(point) {
  Map.addLayer(point,{color:'#0096c7'},'current location');
  Map.centerObject(point,15);
}
function error_msg(error) {
  print(error);
}
ui.util.getCurrentPosition(current_position, error_msg);
function clearGeometry() {
  // Remove last drawn geometry from the dummy layer
  var dummyLayer = drawingTools.layers().get(0).geometries();
  var nbGeometries = dummyLayer.length();
  if (nbGeometries>0){
    dummyLayer.remove(dummyLayer.get(nbGeometries-1));
  }
}
function commitGeometry() {
  var dummyLayer = drawingTools.layers().get(0).geometries();
  var Layer = drawingTools.layers().get(1).geometries();
  var nbGeometries = dummyLayer.length();
  if (nbGeometries>0){
    Layer.add(dummyLayer.get(nbGeometries-1));
    dummyLayer.remove(dummyLayer.get(nbGeometries-1));
  }
}
function measure_area(geometry){
  return geometry.area().divide(1000 * 1000);
}
function transform_to_FC (geometry) {
    return ee.Feature(geometry);
}
var drawingTools = Map.drawingTools();
drawingTools.setDrawModes(['point','line','polygon']);
while (drawingTools.layers().length() === 0) {
  var dummyLayer = ui.Map.GeometryLayer({geometries: null, name: 'geometries', color: 'grey'});
  var Layer = ui.Map.GeometryLayer({geometries: null, name: 'pointGeometries', color: '#0096c7'}); 
  drawingTools.layers().add(dummyLayer);        
  drawingTools.layers().add(Layer);        
}
var infoPanel = ui.Panel({
  style:
      {height: '60px', width: '180px', position: 'bottom-right', shown: false}
});
Map.add(infoPanel);
var Layer = drawingTools.layers().get(1);
function calculate_info() {
  if (!infoPanel.style().get('shown')) {infoPanel.style().set('shown', true);}
  drawingTools.setShape(null); 
  var nb = Layer.geometries().length();
  var basicInfo = ui.Label({value:' N° Drawn Shapes: '+nb});
  infoPanel.widgets().reset([basicInfo]);
}
drawingTools.onDraw(ui.util.debounce(calculate_info, 500));
drawingTools.onEdit(ui.util.debounce(calculate_info, 500));
var symbol = {Commit:'', Remove: '🗑️'};
var controlPanel = ui.Panel({
  widgets: [
    ui.Label('1. Select a drawing mode'),
    ui.Label('2. Draw a geometry'),
    ui.Label('3. Commit or Remove Geometry'),
    ui.Button({
      label: symbol.Commit + ' Commit Geometry',
      onClick: commitGeometry,
      style: {stretch: 'horizontal'}
    }),
    ui.Button({
      label: symbol.Remove + ' Remove Geometry',
      onClick: clearGeometry,
      style: {stretch: 'horizontal'}
    })
  ],
  style: {position: 'bottom-left'},
  layout: null,
});
var downloadLabel = ui.Label('4. Download Layer');
var downloadButton = ui.Button({
          label: 'Download',
          onClick: function(){
            var layer = drawingTools.layers().get(1).geometries();
            var now = new Date();
            var fileName = 'Shapes_'+now.toLocaleDateString('en-CA');
            if (layer.length()!==0){// download if layer length is not 0
              var layerFC = ee.FeatureCollection(layer.map(transform_to_FC));
              var url = layerFC.getDownloadURL({format: 'GeoJSON',filename: fileName});
              urlLabel.setUrl(url); // Sets the url of the label, which will cause it to render as a link.
              urlLabel.style().set({shown: true}); 
            } 
          },
          style: {stretch: 'horizontal'}
        });
var urlLabel = ui.Label('- - - - - - - - - - - - - Link - - - - - - - - - - - - -',{shown: false});
var downloadPanel = ui.Panel([downloadLabel,downloadButton, urlLabel]);
controlPanel.add(downloadPanel);
Map.add(controlPanel);
