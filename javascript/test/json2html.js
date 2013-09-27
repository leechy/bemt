describe("JSON->HTML Composer", function() {
	it("generates an html element", function() {
		var result = bemt.json2html([{
			"t": "title",
		}]);
		var correctAnswer = '<title></title>';
		expect(result).toEqual(correctAnswer);
	});

	it("generates an html element with text content", function() {
		var result = bemt.json2html([{
			"t": "title",
			"c": "Hello, World!"
		}]);
		var correctAnswer = '<title>Hello, World!</title>';
		expect(result).toEqual(correctAnswer);
	});

	it("can build a simplest “Hello, World!” document", function() {
		var result = bemt.json2html([{
			"t": "html",
			"c": [
				{
					"t": "body",
					"c": [
						{
							"t": "h1",
							"c": "Hello, World!"
						},
					]
				},
			]
		}]);
		var correctAnswer = '<html><body><h1>Hello, World!</h1></body></html>';
		expect(result).toEqual(correctAnswer);
	});

	it("omits closing tags on empty elements", function() {
		var result = bemt.json2html([{
			"t": "wbr"
		}]);
		var correctAnswer = '<wbr>';
		expect(result).toEqual(correctAnswer);
	});

	it("adds non-bem attributes", function() {
		var result = bemt.json2html([{
			"t": "base",
			"a": {
				"href": "http://ya.ru/",
				"target": "_blank"
			}
		}]);
		var correctAnswer = '<base href="http://ya.ru/" target="_blank">';
		expect(result).toEqual(correctAnswer);
	});

	it("replaces non-bem attributes", function() {
		var result = bemt.json2html([{
			"t": "base",
			"a": {
				"href": "http://ya.ru/",
				"target": "_blank"
			},
			"c": [
				{
					"a": {
						"href": "http://yandex.ru/search?q=123"
					}
				}
			]
		}]);
		var correctAnswer = '<base href="http://yandex.ru/search?q=123" target="_blank">';
		expect(result).toEqual(correctAnswer);
	});

	it("appends non-bem attributes", function() {
		var result = bemt.json2html([{
			"t": "base",
			"a": {
				"href": "http://ya.ru/",
				"target": "_blank"
			},
			"c": [
				{
					"a": {
						"href=+": "search?q=123"
					}
				}
			]
		}]);
		var correctAnswer = '<base href="http://ya.ru/search?q=123" target="_blank">';
		expect(result).toEqual(correctAnswer);
	});

	it("appends class value separated by space", function() {
		var result = bemt.json2html([{
			"t": "h1",
			"a": {
				"class": "title",
			},
			"c": [
				{
					"a": {
						"class=+": "blue"
					},
					"c": "Hello, World!"
				}
			]
		}]);
		var correctAnswer = '<h1 class="title blue">Hello, World!</h1>';
		expect(result).toEqual(correctAnswer);
	});

	it("removes attribute value separated by space", function() {
		var result = bemt.json2html([{
			"t": "h1",
			"a": {
				"class": "title blue",
			},
			"c": [
				{
					"a": {
						"class=-": "blue"
					},
					"c": "Hello, World!"
				}
			]
		}]);
		var correctAnswer = '<h1 class="title">Hello, World!</h1>';
		expect(result).toEqual(correctAnswer);
	});

	it("parses empty attribute", function() {
		var result = bemt.json2html([{
			"t": "td",
			"a": {
				"nowrap": "",
			},
			"c": "Hello, World!"
		}]);
		var correctAnswer = '<td nowrap>Hello, World!</td>';
		expect(result).toEqual(correctAnswer);
	});

	it("generates a block with elements", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"c": "Тело новости"
				}
			]
		}]);
		var correctAnswer = '<article class="article"><h1 class="article__title">Заголовок</h1><div class="article__body">Тело новости</div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("generates two blocks, one within another", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"c": "Тело новости"
						}
					]
				}
			]
		}]);
		var correctAnswer = '<article class="article"><h1 class="article__title">Заголовок</h1><div class="article__body"><div class="ugc">Тело новости</div></div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("understands strings between elements", function() {
		var result = bemt.json2html([{
			"t": "p",
			"c": [
				"Вот такая ",
				{
					"t": "span",
					"c": "бывает"
				},
				" Земля ",
				{
					"t": "a",
					"a": {
						"href": "http://earth.org/"
					},
					"c": "ночью"
				}
			]
		}]);
		var correctAnswer = '<p>Вот такая <span>бывает</span> Земля <a href="http://earth.org/">ночью</a></p>';
		expect(result).toEqual(correctAnswer);
	});

	it("applies a modifier param to the block and it's elements", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"m": ["theme"],
					"c": "Тело новости"
				}
			]
		}], {
			"mods": {
				"theme": "winter"
			}
		});
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="article__body article__body_theme_winter">Тело новости</div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("applies a modifier param to the child blocks", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"m": ["theme"],
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"m": ["theme"],
							"c": "Тело новости"
						}
					]
				}
			]
		}], {
			"mods": {
				"theme": "winter"
			}
		});
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="article__body article__body_theme_winter"><div class="ugc ugc_theme_winter">Тело новости</div></div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("applies internal modifier", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"mods": {
				"theme": "winter"
			},
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"m": ["theme"],
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"m": ["theme"],
							"c": "Тело новости"
						}
					]
				}
			]
		}]);
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="article__body article__body_theme_winter"><div class="ugc ugc_theme_winter">Тело новости</div></div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("rewrites nested internal modifier", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"mods": {
				"theme": "winter"
			},
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"m": ["theme"],
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"m": ["theme"],
							"mods": {
								"theme": "summer"
							},
							"c": "Тело новости"
						}
					]
				}
			]
		}]);
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="article__body article__body_theme_winter"><div class="ugc ugc_theme_summer">Тело новости</div></div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("rewrites nested modifier from params", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"m": ["theme"],
					"mods": {
						"theme": "summer"
					},
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"m": ["theme"],
							"c": "Тело новости"
						}
					]
				}
			]
		}], {
			"mods": {
				"theme": "winter"
			}
		});
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="article__body article__body_theme_summer"><div class="ugc ugc_theme_summer">Тело новости</div></div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("rewrites modifier in separate element (like changing by the test function)", function() {
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"m": ["theme"],
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"mods": {
						"theme": "summer"
					},
					"c": [
						{
							"b": "ugc",
							"t": "div",
							"m": ["theme"],
							"c": "Тело новости"
						}
					]
				}
			]
		}], {
			"mods": {
				"theme": "winter"
			}
		});
		var correctAnswer = '<article class="article article_theme_winter"><h1 class="article__title">Заголовок</h1><div class="ugc ugc_theme_summer">Тело новости</div></article>';
		expect(result).toEqual(correctAnswer);
	});

	it("output with identation", function() {
		bemt.set({
			'indent': true,
			'indentSize': '  '
		})
		var result = bemt.json2html([{
			"b": "article",
			"t": "article",
			"c": [
				{
					"e": "title",
					"t": "h1",
					"c": "Заголовок"
				},
				{
					"e": "body",
					"t": "div",
					"c": "Тело новости"
				}
			]
		}]);
		var correctAnswer = '<article class="article">\n  <h1 class="article__title">Заголовок</h1>\n  <div class="article__body">\n    Тело новости\n  </div>\n</article>\n';
		expect(result).toEqual(correctAnswer);
	});

	it("generate more than one root object", function() {
		bemt.set({
			'indent': false,
			'indentSize': '  '
		})
		var result = bemt.json2html([
			{
				"b": "item",
				"t": "div",
				"c": [
					{
						"e": "title",
						"t": "h1",
						"c": "Заголовок"
					}
				]
			},
			{
				"b": "item",
				"t": "div",
				"c": [
					{
						"e": "title",
						"t": "h1",
						"c": "Заголовок"
					}
				]
			}
		]);
		var correctAnswer = '<div class="item"><h1 class="item__title">Заголовок</h1></div><div class="item"><h1 class="item__title">Заголовок</h1></div>';
		expect(result).toEqual(correctAnswer);
	});

	it("simple document with a doctype", function() {
		bemt.set({
			'indent': true,
			'indentSize': '\t'
		})
		var result = bemt.json2html([
			{
				"t": "!doctype",
				"a": {
					"html": ""
				}
			},
			{
				"t": "html",
				"c": [
					{
						"t": "head",
						"c": [
							{
								"t": "title",
								"c": "Hello, World!"
							}
						]
					},
					{
						"t": "body"
					}
				]
			}
		]);
		var correctAnswer = '<!doctype html>\n<html>\n\t<head>\n\t\t<title>Hello, World!</title>\n\t</head>\n\t<body>\n\t</body>\n</html>\n';
		expect(result).toEqual(correctAnswer);
	});


});