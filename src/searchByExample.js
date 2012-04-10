"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.finderPage = (function () {
	var nameSearchTimeout;
	var styleFormatSearchTimeout;

	// used to display HTML tags for debugging
	var escapeHTML = function (string) {
		return $('<pre>').text(string).html();
	};

	var displaySearchResults = function (styles, outputNode) {
		var index,
			outputList = [],
			masterStyleSuffix = "",
			style,
			citation,
			bibliography;

		for (index = 0; index < Math.min(styles.length, 20); index++)
		{
			style = styles[index];
			if (style.masterId != style.styleId)
			{
				masterStyleSuffix = ' (same as <a href="' + style.masterId + '">' +
							exampleCitations.styleTitleFromId[style.masterId] + '<\/a>)';
			} else {
				masterStyleSuffix = '';
			}

			citation = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedCitations[0];
			bibliography = exampleCitations.exampleCitationsFromMasterId[style.masterId].formattedBibliography;

			if (typeof style.userCitation !== "undefined" &&
				style.userCitation !== "" &&
				citation !== "") {
				citation = CSLEDIT.diff.prettyHtmlDiff(style.userCitation, citation);
			}

			if (typeof style.userBibliography !== "undefined" &&
				style.userBibliography !== "" &&
				bibliography !== "") {
				bibliography = CSLEDIT.diff.prettyHtmlDiff(style.userBibliography, bibliography);
			}

			outputList.push('<a href="' + style.styleId + '">' +
				exampleCitations.styleTitleFromId[style.styleId] + "<\/a>"
				+ masterStyleSuffix + "<br \/>" +
				'<table>' +
				'<tr><td><span class="faint">Inline citaiton<\/span>' +
				'<\/td><td>' +
				citation + '<\/td><\/tr>' +
				'<tr><td><span class="faint">Bibliography<\/span><\/td><td>' +
				bibliography + "<\/td><\/tr>" +
				'<tr><td><\/td><td><a href="../cslEditor/?styleURL=' + style.styleId + '">Edit style<\/a><\/td><\/tr>' +
				'<\/table>');

		}
		
		outputNode.html(
			'<p>Displaying ' + outputList.length + ' results:<\/p>' +
				outputList.join("<p><p>")
		);
	};

	// --- Functions for formatted style search ---

	function authorString(authors) {
		var result = [],
			index = 0;
		for (index = 0; index < authors.length; index++) {
			//alert(author);
			result.push(authors[index].given + " " + authors[index].family);
		}
		return result.join(", ");
	}

	var clEditorIsEmpty = function (node) {
		var text = $(node).cleditor()[0].doc.body.innerText;

		return text === "" || text === "\n";
	};

	function searchForStyle() {
		var tolerance = 500,
			bestEditDistance = 999,
			bestMatchIndex = -1,
			userCitation = $("#userCitation").cleditor()[0].doc.body.innerHTML,
			userCitationText = $("#userCitation").cleditor()[0].doc.body.innerText,
			userBibliography = $("#userBibliography").cleditor()[0].doc.body.innerHTML,
			userBibliographyText = $("#userBibliography").cleditor()[0].doc.body.innerText,
			cleanHTML = function (html) {
				html = html.replace(/<span[^<>]*>/g, "");
				html = html.replace(/<\/span>/g, "");
				html = html.replace(/&nbsp;/g, " ");

				// remove any attributes the tags may have
				html = html.replace(/<(b|i|u|sup|sub)[^<>]*>/g, "<$1>");
				return html;
			},
			result = [],
			editDistances = [],
			index = 0,
			styleId,
			exampleCitation,
			formattedCitation,
			thisEditDistance,
			row = function (title, value) {
				return "<tr><td><span class=faint>" + title + "<\/span><\/td><td>" + value + "<\/td><\/tr>";
			};

		userCitation = cleanHTML(userCitation);
		userBibliography = cleanHTML(userBibliography);

		if (clEditorIsEmpty("#userCitation")) {
			userCitation = "";
		}
		if (clEditorIsEmpty("#userBibliography")) {
			userBibliography = "";
		}

		//result.push("<p>searching for " + escapeHTML(userCitation) + "<\/p>");
		//result.push("<p>searching for " + escapeHTML(userBibliography) + "<\/p>");

		for (styleId in exampleCitations.exampleCitationsFromMasterId) {
			if (exampleCitations.exampleCitationsFromMasterId.hasOwnProperty(styleId)) {
				exampleCitation = exampleCitations.exampleCitationsFromMasterId[styleId];

				if (exampleCitation !== null && exampleCitation.statusMessage === "") {
					formattedCitation = exampleCitation.formattedCitations[0];
					thisEditDistance = 0;

					if (userCitation !== "") {
						thisEditDistance += CSLEDIT.diff.customEditDistance(userCitation, formattedCitation);
					}
					if (userBibliography !== "") {
						thisEditDistance += CSLEDIT.diff.customEditDistance(userBibliography, exampleCitation.formattedBibliography);
					}

					if (thisEditDistance < tolerance)
					{
						editDistances[index++] = {
							editDistance : thisEditDistance,
							styleId : styleId
						};
					}

					if (thisEditDistance < bestEditDistance) {
						bestEditDistance = thisEditDistance;
					}
				}
			}
		}
		editDistances.sort(function (a, b) {return a.editDistance - b.editDistance});

		// TODO: only put editDistances < tolerance

		// top results
		for (index=0; index < Math.min(5, editDistances.length); index++) {		
			result.push({
					styleId : editDistances[index].styleId,
					masterId : editDistances[index].styleId,
					userCitation : userCitation,
					userBibliography : userBibliography
			}
			);
		}
		
		CSLEDIT.searchResults.displaySearchResults(result, $("#styleFormatResult"));
	}

	function formatFindByStyleExampleDocument() {
		var jsonDocuments = cslServerConfig.jsonDocuments;
		document.getElementById("explanation").innerHTML = "<i>Please edit this example citation to match the style you are searching for.<br />";
		document.getElementById("exampleDocument").innerHTML =
			"<p align=center><strong>Example Article<\/stong><\/p>" +
			"<table>" +
			"<tr><td>Title:<\/td><td>" + jsonDocuments["ITEM-1"].title + "<\/td><\/tr>" +
			"<tr><td>Authors:<\/td><td>" + authorString(jsonDocuments["ITEM-1"].author) + "<\/td><\/tr>" + 
			"<tr><td>Year:<\/td><td>" + jsonDocuments["ITEM-1"].issued["date-parts"][0][0] + "<\/td><\/tr>" +
			"<tr><td>Publication:<\/td><td>" + jsonDocuments["ITEM-1"]["container-title"] + "<\/td><\/tr>" +
			"<tr><td>Volume:<\/td><td>" + jsonDocuments["ITEM-1"]["volume"] + "<\/td><\/tr>" +
			"<tr><td>Issue:<\/td><td>" + jsonDocuments["ITEM-1"]["issue"] + "<\/td><\/tr>" +
			"<tr><td>Chapter:<\/td><td>" + jsonDocuments["ITEM-1"]["chapter-number"] + "<\/td><\/tr>" +
			"<tr><td>Pages:<\/td><td>" + jsonDocuments["ITEM-1"]["page"] + "<\/td><\/tr>" +
			"<tr><td>Publisher:<\/td><td>" + jsonDocuments["ITEM-1"]["publisher"] + "<\/td><\/tr>" +
			"<tr><td>Document type:<\/td><td>" + jsonDocuments["ITEM-1"]["type"] + "<\/td><\/tr>" +
			"<\/table>";
	}

	function formChanged() {
		clearTimeout(styleFormatSearchTimeout);
		styleFormatSearchTimeout = setTimeout(searchForStyle, 1000);
	}

	return {
		init : function () {		
			formatFindByStyleExampleDocument();
			$("#inputTabs").tabs({
				show: function (event, ui) {
					if (ui.panel.id === "styleNameInput") {
						$("#styleNameResult").show();
						$("#styleFormatResult").hide();
					} else {
						$("#styleNameResult").hide();
						$("#styleFormatResult").show();
					}
				}
			});
			$.cleditor.defaultOptions.width = 390;
			$.cleditor.defaultOptions.height = 100;
			$.cleditor.defaultOptions.controls =
				"bold italic underline strikethrough subscript superscript ";
			//		+ "| undo redo | cut copy paste";

			var userCitationInput = $("#userCitation").cleditor({height: 55})[0];
			$("#userBibliography").cleditor({height: 85});

			$("#userCitation").cleditor()[0].change(formChanged);
			$("#userBibliography").cleditor()[0].change(formChanged);
		
			// prepopulate search by style format with APA example
			$("#userCitation").cleditor()[0].doc.body.innerHTML =
				exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].formattedCitations[0];
			$("#userBibliography").cleditor()[0].doc.body.innerHTML =
				exampleCitations.exampleCitationsFromMasterId["http://www.zotero.org/styles/apa"].formattedBibliography;

			formChanged();
		}
	};
}());

$(document).ready(function () {
	CSLEDIT.finderPage.init();		
});

