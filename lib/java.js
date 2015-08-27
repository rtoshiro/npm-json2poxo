var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');

(function(lang) {
  var _capitalize = function(value) {
    if (typeof value !== 'string')
      throw new Error("Argument 1 has to be a string");
    if (value.length > 1)
      return value.charAt(0).toUpperCase() + value.toLowerCase().substring(1);
    else
      return value.toUpperCase();
  };

  lang.reservedWords = ["abstract", "continue", "for", "new", "switch", "assert", "default", "goto",
    "package", "synchronized", "boolean", "do", "if", "private", "this", "break", "double", "implements",
    "protected", "throw", "byte", "else", "import", "public", "throws", "case", "enum", "instanceof",
    "return", "transient", "catch", "extends", "int", "short", "try", "char", "final", "interface", "static",
    "void", "class", "finally", "long", "strictfp", "volatile", "const", "float", "native", "super", "while"
  ];

  lang.primaryKeys = ["id", "identifier", "uid"];

  lang.types = {
    "string" : "String",
    "number" : "long",
    "boolean": "boolean",
    "object" : "Object"
  };

  lang.classes = function(_class, params) {
    if (params !== null) {
      if (params.hasOwnProperty('package'))
        _class.package = params.package;

      if (params.hasOwnProperty('package'))
        _class.includeGson = params.includeGson;
    }
    else {
      _class.package = "com.example";
      _class.includeGson = false;
    }
    // console.log(params);

    for (var i = 0; i < _class.properties.length; i++) {
      var _property = _class.properties[i];

      if (!_class.includeGson) {
        _property.name = _property.originalName;
      }

      _property.uppername = _property.name.toUpperCase();
      _property.capname = _capitalize(_property.name);
      _property.capOriginalName = _capitalize(_property.originalName);
      if (_property.isArray) {
        if (_property.type === 'Object') {
          _property.type = "ArrayList<" + _capitalize(_property.name) + ">";
        } else if (_property.type === 'long') {
          _property.type = "ArrayList<Long>";
        } else if (_property.type === 'String') {
          _property.type = "ArrayList<String>";
        }
      }

      if (lang.primaryKeys.indexOf(_property.name.toLowerCase()) > -1) {
        _class.primaryKey = _property.name;
      }
    }

    _class.capkey = _class.primaryKey ? _capitalize(_class.primaryKey) : false;
    return _class;
  };

  var template = null;
  lang.template = function(_class, _poxo) {
    if (template === null) {
      var src = fs.readFileSync(path.normalize(__dirname + path.sep + '../tpl/java.mustache'), 'utf8');
      template = handlebars.compile(src);
    }
    var result = template(_class);
    return [_poxo(_class.name + ".java", result)];
  };

  return lang;
})(exports || {});
