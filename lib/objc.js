var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');

(function(lang) {

  function _capitalize(value) {
    if (typeof value !== 'string')
      throw new Error("Argument 1 has to be a string");
    if (value.length > 1)
      return value.charAt(0).toUpperCase() + value.toLowerCase().substring(1);
    else
      return value.toUpperCase();
  }

  lang.reservedWords = ["auto", "break", "case", "char", "const", "continue",
  "class", "default", "do", "double", "else", "enum", "extern", "float", "for",
  "goto", "if", "id", "implementation", "inline", "int", "interface", "long",
  "nonatomic", "property", "protocol", "readonly", "readwrite", "register",
  "restrict", "retain", "return", "short", "signed", "sizeof", "static", "strong",
  "struct", "switch", "typedef", "union", "unsafe_unretained", "unsigned", "void",
  "volatile", "weak", "while", "_bool", "_complex", "_imaginary", "sel", "imp",
  "bool", "nil", "yes", "no", "self", "super", "__strong", "__weak", "oneway",
  "in", "out", "inout", "bycopy", "byref"
  ];

  lang.primaryKeys = ["id", "identifier", "uid"];

  lang.types = {
    "string" : "NSString *",
    "number" : "NSNumber *",
    "boolean": "BOOL",
    "object" : "id"
  };

  lang.classes = function(_class, params) {
    var now = new Date();
    if (params !== null && params.hasOwnProperty('prefix')) {
      _class.name = params.prefix + _class.name;
    }

    for (var i = 0; i < _class.properties.length; i++) {
      var _property = _class.properties[i];
      _property.isObject = _property.type == "id";
      _property.isString = _property.type == "NSString *";
      _property.isNumber = _property.type == "NSNumber *";
      _property.isBool = _property.type == "BOOL";

      _property.uppername = _property.name.toUpperCase();
      _property.capname = _capitalize(_property.name);
      if (_property.isArray) {
        _property.type = "NSMutableArray *";
      }
      _property.memory = "strong";
      if (_property.type == "BOOL"){
        _property.memory = "assign";
      }
    }

    _class.year = now.getFullYear();
    _class.today = now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDay();
    _class.capkey = _class.primaryKey ? _capitalize(_class.primaryKey) : false;
    return _class;
  };

  var templateH = null;
  var templateM = null;
  lang.template = function(_class, _poxo) {
    if (templateH === null) {
      srcH = fs.readFileSync(path.normalize(__dirname + path.sep + '../tpl/objch.mustache'), 'utf8');
      templateH = handlebars.compile(srcH);
    }

    if (templateM === null) {
      var srcM = fs.readFileSync(path.normalize(__dirname + path.sep + '../tpl/objcm.mustache'), 'utf8');
      templateM = handlebars.compile(srcM);
    }

    var result = [];

    var resultH = templateH(_class);
    result.push(_poxo(_class.name + ".h", resultH));

    var resultM = templateM(_class);
    result.push(_poxo(_class.name + ".m", resultM));

    return result;
  };

  return lang;
})(exports || {});
