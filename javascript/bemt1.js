(function(global) {
	var bemt = function() {
        var reStringSplit = /([^"\s]*("[^"]*")[^"\s]*)|[^"\s]+/g;

        // global settings
        // change via set method
        var settings = {
        	// output
        	mode: "html", // available "html", "xml", "text"?

        	// dev tools
        	debug: true, // adds line/token positions in json and throws warnings if smth goes wrong
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
				offsetsArray.length = position;
				offsetsArray.push({
					node: node,
					offset: offset
				});
			}

			function createBranch(string, offset) {
				// adding new branch to resultsArray at the root level
				var len = resultsArray.push({
					string: string
				});
				var node = resultsArray[len - 1];
				if (settings.debug) {
					node.lineNo = currentLine
				}
				// set new start offset, with new branch as a start node
				setOffset(node, offset, 0);
			}

			function createChild(string, offset, parent, parentOffsetIdx) {
				// if there's no parent node, we should create new root branch
				if (!parent) {
					createBranch(string, offset);
					return;
				}
				// if parent has no children array - create one
				if (!parent.children) {
					parent.children = [];
				}
				// add new node to the children array
				var len = parent.children.push({
					string: string
				})
				var node = parent.children[len - 1];
				if (settings.debug) {
					node.lineNo = currentLine
				}
				// add new offset to offsetsArray, at the parent position
				setOffset(node, offset, parentOffsetIdx);
			}

			// splitting templateText to an array
			linesArray = source.split('\n');

			// 
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
					createChild(string, offset, parent, parentOffsetIdx);
				} else {
					// if there was no offset – create new root branch
					createBranch(line, '');
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



console.log(bemt.parseTree('div\n  div\n    p\n  span'));