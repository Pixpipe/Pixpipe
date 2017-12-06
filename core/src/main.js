const fs = require('fs');
const jsonfile = require('jsonfile');
const handlebars = require('handlebars');
const showdown  = require('showdown');
const copydir = require('copy-dir');

const contentFolder = "content";
const configFilename = "config.json";
const contenFilename = "content.md";
const dataDirname = "data";
const root = "..";
const defaultHeaderImage = "https://images.unsplash.com/photo-1507834392452-0559ec185662?w=1650";

const templates = {
  home: "templates/home.html",
  generic: "templates/generic.html"
};

var md2htmlconverter = new showdown.Converter();

var validContentDirectories = [];

fs.readdirSync(contentFolder).forEach( function(path){
  var dirPath = contentFolder + "/" + path;
  
  // must NOT be a file
  if(!fs.lstatSync(dirPath).isDirectory())
    return;
    
  // must NOT be hidden
  if(path[0] === ".")
    return;
    
  // private when start with underscore  
  if(path[0] === "_")
    return;
  
  // these folders must not be replaced
  if(path === "core"   ||
     path === "assets" ||
     path === "images")
    return;

  
  // must contain a "config.json" file
  if(! fs.existsSync(dirPath + "/" + configFilename) )
    return;
    
  // must contain a "content.md" file
  if(! fs.existsSync(dirPath + "/" + contenFilename) )
    return;
    
  validContentDirectories.push( path );
});


validContentDirectories.forEach( function( folder, index ){
  var configPath = `./${contentFolder}/${folder}/${configFilename}`;
  var contentPath = `./${contentFolder}/${folder}/${contenFilename}`;
  var dataPath = `./${contentFolder}/${folder}/${dataDirname}`;
  
  var config = jsonfile.readFileSync(configPath);
  var templatePath = templates[ config.template ];
  
  /*
  console.log( folder );
  console.log( index );
  console.log( config );
  */
  
  var templateString = getFileContent( templatePath ); 
  var contentString = getFileContent( contentPath );
  var isThereDataFolder = fs.existsSync( dataPath );
  
  // both the content and the template must be valid
  if( !templateString || !contentString )
    return;
  
  var htmlContent = md2htmlconverter.makeHtml( contentString );
  var template = handlebars.compile( templateString );
  
  var fullHtml = template({
    folderName: folder,
    title: config.title,
    subtitle: config.subtitle,
    image: config.image || defaultHeaderImage,
    content: htmlContent
  });
  
  //var destPath = `${root}/${folder}`;
  //var indexPath = `${root}/${folder}/index.html`;
  
  var destPath = folder === "index" ? `${root}` : `${root}/${folder}`;
  var indexPath = `${destPath}/index.html`;
  
  if( folder !== "index" ){
    deleteFolderRecursive( destPath )
    fs.mkdirSync(destPath);
    fs.mkdirSync(destPath + "/data");
  }
  
  fs.writeFileSync( indexPath, fullHtml );
  copydir.sync( dataPath, destPath + "/data"  );
})

// get the content of a file as a text
function getFileContent( path ){
  var content = null;
  try{
    content = fs.readFileSync(path, 'utf8');
  }catch(e){
    console.warn(e);
  }
  return content;
}


function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
