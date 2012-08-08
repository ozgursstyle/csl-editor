"use strict";


module("Create view for all nodes in top styles");

asyncTest("setup views for all popular styles", function () {
	var styles = CSLEDIT_testUtils.getStyles(40),
		fakeDropdownMenuHandler = function () {},
		fakeSyntaxHighlighter = {
			selectedNodeChanged : function () {}
		},
		updates;

	ok("schemaOptions" in CSLEDIT);
	window.CSLEDIT_schema = CSLEDIT_Schema(CSLEDIT_schemaOptions);
	CSLEDIT_schema.callWhenReady( function () {
		ok(true, "schema loaded");

		window.CSLEDIT_data = CSLEDIT_Data("CSLEDIT_testData");
		CSLEDIT_data.setCslCode(styles[Object.keys(styles)[0]]);

		window.CSLEDIT_viewController = CSLEDIT_ViewController(
			$('<div/>'), $('<div/>'), $('<div/>'), $('<div/>'),
			fakeSyntaxHighlighter
		);
		
		CSLEDIT_data.addViewController(CSLEDIT_viewController);
		
		CSLEDIT_viewController.init(CSLEDIT_data.get(), {
			formatCitations : function () { 
				processNextStyle();
			},
			//deleteNode : function () {},
			//moveNode : function () {},
			//checkMove : function () {},
			viewInitialised : function () {}
		});
	});

	var processNextStyle = function () {
		var result,
			styleUrl,
			styleCode,
			title;

		$.each(styles, function (url, cslCode) {
			styleUrl = url;
			styleCode = cslCode;
			return false;
		});

		if (typeof(styleUrl) === "undefined") {
			start(); // finish this test
			return;
		}

		delete styles[styleUrl];

		result = CSLEDIT_data.setCslCode(styleCode);

		if ("error" in result) {
			// should only get dependent style errors in repo styles
			ok(result.error.indexOf("dependent style") !== -1, "dependent style: " + styleUrl);
			processNextStyle();
		} else {
			title = CSLEDIT_data.getNodesFromPath("style/info/title")[0].textValue;
			ok(true, "processing style " + title);
		}
	};
});
