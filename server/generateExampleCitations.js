// jslib stuff

LoadModule('jsio');
LoadModule('jsstd');
LoadModule('jsiconv');

var dec = new Iconv('UCS-2-INTERNAL','UTF-8',true,false);
var enc = new Iconv('UTF-8','UCS-2-INTERNAL',false,true);

var load = Exec;

var print = function(txt){
	Print( enc(txt)+'\n');
}

var readFile = function(filename){
    var file = new File(filename);
    file.Open( File.RDONLY );
    var ret = dec( file.Read() );
    file.Close();
    return ret;
}

// citeproc includes

load("../external/citeproc/loadabbrevs.js");
load("../external/citeproc/xmle4x.js");
load("../external/citeproc/xmldom.js");
//load("../external/citeproc/load.js");
load("../external/citeproc/citeproc.js");
load("../external/citeproc/loadlocale.js");
load("../external/citeproc/loadsys.js");
load("../external/citeproc/runcites.js");
load("../src/citationEngine.js");

// start

load("../external/citeproc/xmle4x.js");
load("config.js");

// TODO: put following items in a single JSON object for persistent storage

// loop through the parent (unique) csl-styles generating example citations for
// each one

var masterStyleFromId = {};

var outputData = {
	masterIdFromId : {},

	// list of dependent styles for each master style ID
	dependentStylesFromMasterId : {},
	exampleCitationsFromMasterId : {},
	styleTitleFromId : {}
};

var dir = new Directory( cslServerConfig.cslStylesPath );
dir.Open();
var entries = 0;
for ( var entry; ( entry = dir.Read() ); )
{
	var file = new File(dir.name + '/' + entry);
	if (file.info.type == 1)
	{
		//Print( entry + '\n');
		entries++;

		// TODO: parse XML to determine citation style URI
		file.Open(File.RDONLY);
		var fileData = dec(file.Read());
		//Print( 'parsing ' + entry + '\n');
		
		var xmlParser = new CSL_E4X();
		var xmlDoc;

		xmlDoc = "notSet";
		try
		{
			xmlDoc = xmlParser.makeXml(fileData);
		}
		catch (err)
		{
			Print( 'FAILED to parse ' + entry + '\n' );
		}

		if (xmlDoc !== "notSet")
		{
			var styleId = xmlParser.getStyleId(xmlDoc);
			Print( 'parsed ' + styleId + '\n' );
			masterStyleFromId[styleId] = fileData;

			// TODO: find out why this is needed!
		    default xml namespace = "http://purl.org/net/xbiblio/csl";
			//with({});
			var styleTitleNode = xmlDoc.info.title;
			if (styleTitleNode && styleTitleNode.length())
			{
				var styleTitle = styleTitleNode[0].toString();
				print('title: ' + styleTitle);

				outputData.styleTitleFromId[styleId] = styleTitle;
			}

			var citeprocResult = citationEngine.formatCitations(
				fileData, cslServerConfig.jsonDocuments, cslServerConfig.citationsItems);

			outputData.exampleCitationsFromMasterId[styleId] = citeprocResult;
			//Print(citeprocResult.formattedBibliography + '\n');

		}
	}
}

Print( "num entries = " + entries);

// output results to JSON file:

var outputDir = new Directory(cslServerConfig.dataPath);
var outputFile = new File(outputDir.name + '/exampleCitations.js');
if (!outputDir.exist)
{
	outputDir.Make();
}
outputFile.Open(File.WRONLY | File.CREATE_FILE);
outputFile.Write("var exampleCitations = " + enc(JSON.stringify(outputData, null, "\t")) + ';');

