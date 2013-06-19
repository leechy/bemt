(function(global) {
	var bemt = function() {
        var reStringSplit = /([^"\s]*("[^"]*")[^"\s]*)|[^"\s]+/g;

        // global settings
        // change via set method
        var settings = {
        	// output
        	mode: "html", // available "html", "xml", "text"?

        	// dev tools
        	debug: false, // adds line/token positions in json and throws warnings if smth goes wrong
        	console: null // custom console object
        }

		function parseTree(source) {
	        var reNotEmpty = /\S/,
	            reOffset = /^(\s+)(.*)/,
 				linesArray = [], // source, splitted by newline symbol
				resultsArray = [], // json with tree-like structure
					// [{ string: 'parent 1', children: [{ string: 'children', ... }] }, { string: 'parent 2' }]
				offsetsArray = [], // array with all ancestor offsets to the current line
					// [{ node: *pointer to resultsArray node*, offset: '  ' }, { node: *pointer to resultsArray node*, offset: '    ' }]
				currentLine = 0;

			// helper functions
			function setOffset(node, offset, position) {
				offsetsArray.length = position || 0;
				offsetsArray.push({
					node: node,
					offset: offset
				});
			}

			function createLine(string, offset, parent, parentOffsetIdx) {
				var lineArray = resultsArray;
				if (parent) {
					// if parent has no children array - create one
					if (!parent.children) {
						parent.children = [];
					}
					lineArray = parent.children;
				}
				var line = {
					string: string
				}
				if (settings.debug) {
					line.lineNo = currentLine;
				}
				var len = lineArray.push(line);

				// add new offset to offsetsArray, at the parent position
				setOffset(lineArray[len - 1], offset, parentOffsetIdx);
			}

			// splitting templateText to an array
			linesArray = source.split('\n');

			// iterate over all lines
			for (var i = 0, len = linesArray.length; i < len; i++) {
				var line = linesArray[i];
				currentLine = i + 1;
				// ignore empty lines
				if (!reNotEmpty.test(line)) continue;

				// get line offset
				var offsetMatch = line.match(reOffset);

				if (offsetMatch && offsetsArray.length) {
					var offset = offsetMatch[1],
						string = offsetMatch[2],
						parent = null,
						parentOffsetIdx = 0;
					// checking for the parent from the end of the offsetsArray to the top
					for (var j = offsetsArray.length - 1; j >= 0; j--) {
						// if there is an offset like this – create sibling (child of the parent)
						if (offset === offsetsArray[j].offset) {
							parent = offsetsArray[j - 1].node;
							parentOffsetIdx = j;
							break;
						}
						// if it's not equal, but there is an offset which starts like current - create child
						if (offset.indexOf(offsetsArray[j].offset) == 0) {
							parent = offsetsArray[j].node;
							parentOffsetIdx = j + 1;
							break;
						}
					}
					createLine(string, offset, parent, parentOffsetIdx);
				} else {
					// if there was no offset – create new root branch
					createLine(line, '');
				}
			}
			return resultsArray;
		}

		return {
			parseTree: parseTree
		}
	}

	if (!global.bemt) {
		global.bemt = new bemt();
	}
})(typeof window === 'undefined' ? this : window);



console.log(bemt.parseTree('div\n  div\n    p\n   span'));