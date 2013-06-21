        function prettyPrint(json) {
//            if (window.console) console.log(json);
            
            function branch(obj, offset, last) {
                var output = '';
                if (typeof(obj) == 'object') {
                    if (obj.length) {
                        // array
                        output += '[\n';
                        for (var i in obj) {
                            output += branch(obj[i], offset + '  ', i == obj.length - 1);
                        }
                        output += offset + ']\n';
                    } else {
                        // object
                        output += offset + '{\n';
                        for (var i in obj) {
                            output += offset + '  "' + i + '": ' + branch(obj[i], offset + '  ');
                        }
                        output += offset + '}';
                        if (!last) output += ',';
                        output += '\n';
                    }
                } else {
                    output += '"' + obj + '"\n';
                }
                return output;
            }
            
            var output = branch(json, '');
            return output;
        }




(function(global) {
	var bemt = function() {
        var reTokenSplit = /([^"\s]*("[^"]*")[^"\s]*)|[^"\s]+/g;

        var syntax = {
        	split: '|'
        }

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
	            reTrim = /^\s+|\s+$/g,
	        	reSplit = /([^"\|]*("[^"]*")[^"\|]*)|[^"\|]+/g, // todo: нужно генерить регексп на основе syntax.split!
 				linesArray = [], // source, splitted by newline symbol
				resultsArray = [], // json with tree-like structure
					// [{ string: 'parent 1', children: [{ string: 'children', ... }] }, { string: 'parent 2' }]
				offsetsArray = [], // array with all ancestor offsets to the current line
					// [{ node: *pointer to resultsArray node*, offset: '  ' }, { node: *pointer to resultsArray node*, offset: '    ' }]
				currentLine = 0;

			// helper functions
			function setOffset(current, parent, offset, position, isSplit) {
				offsetsArray.length = position || 0;
				if (isSplit) {
					offsetsArray.push({
						node: parent,
						offset: offset,
						current: current
					});
				} else {
					offsetsArray.push({
						node: current,
						offset: offset,
						current: current
					});
				}
			}

			function appendLine(string, offset, parent, parentOffsetIdx, isSplit) {
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
				setOffset(lineArray[len - 1], parent, offset, parentOffsetIdx, isSplit);
			}

			function getParent(offset, isSplit) {
				var parent = null,
				    idx = 0;

				// checking for the parent from the end of the offsetsArray to the top
				for (var j = offsetsArray.length - 1; j >= 0; j--) {
					// if there is an offset like this – create sibling (child of the parent)
					if (offset === offsetsArray[j].offset) {
						if (isSplit) {
							parent = offsetsArray[j].current;
						} else if (offsetsArray[j - 1]) {
							parent = offsetsArray[j - 1].node;
						} else {
							parent = null;
						}
						idx = j;
						break;
					}
					// if it's not equal, but there is an offset which starts like current - create child
					if (offset.indexOf(offsetsArray[j].offset) == 0) {
						parent = offsetsArray[j].current;
						idx = j + 1;
						break;
					}
				}

				return {
					parent: parent,
					idx: idx
				}
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

				if (offsetMatch) {
					var offset = offsetMatch[1],
						string = offsetMatch[2];

					var offsetParent = getParent(offset, false);

					if (string.indexOf(syntax.split) > 0) { // проверить, почему не сработало с '    | text' ?
						// split lines by |
						var splitArray = string.match(reSplit);
						var isText = false;
						for (var k = 0, klen = splitArray.length; k < klen; k++) {
							var stringPart = splitArray[k].replace(reTrim, '');

							offsetParent = getParent(offset, true);

							if (k == 0 && stringPart == '') {
								isText = true;
							} else {
								if (isText == true) {
									stringPart = syntax.split + stringPart;
									isText = false;
								}
								appendLine(stringPart, offset, offsetParent.parent, offsetParent.idx, !isText);
							}
						}
					} else {
						appendLine(string, offset, offsetParent.parent, offsetParent.idx);
					}
				} else {
					// if there was no offset – create new root branch
					appendLine(line, '');
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