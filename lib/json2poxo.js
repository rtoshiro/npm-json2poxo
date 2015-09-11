var parser = require('jsonlint').parser;

(function(json2poxo) {
  // Object model to normalize JSON
  // Represents a single class property.
  var _property = function(type, name, isArray) {
    return {
      "type": type,
      "name": _normalize(name),
      "originalName" : name,
      "isArray": isArray
    };
  };

  // Object model to normalize JSON
  // Represents a single class.
  var _class = function(name) {
    return {
      "name": name,
      "primaryKey" : false,
      "properties": [],
      "imports" : ""
    };
  };

  // Object model to represent one file
  // class
  var _poxo = function(name, source)
  {
    return {
      "fileName" : name,
      "sourceCode" : source
    };
  };

  // Auxiliar method to traverse classList looking for
  // className. Where classList is an array of _class(es)
  var _getClass = function(classList, className) {
    for (var i = 0; i < classList.length; i++) {
      var cl = classList[i];
      if (cl.name == className)
        return cl;
    }

    var newClass = _class(className);
    classList.push(newClass);
    return newClass;
  };

  // Auxiliar method to insert one _property inside
  // _class, checking if it already exists
  var _pushProperty = function(_class, _property) {
    // if has already exists with same name
    for (var i = 0; i < _class.properties.length; i++) {
      var pr = _class.properties[i];
      if (pr.name === _property.name)
        return;
    }
    _class.properties.push(_property);
  };

  // Receives one js 'object' and transforms into one
  // _class object
  var _parse = function(obj, className, classList) {
    var curClass = _getClass(classList, className);
    if (obj !== null && (typeof obj === 'object')) {

      for (var key in obj) {
        var value = obj[key];
        if (obj.hasOwnProperty(key)) {
          var propertyName = _capitalize(key.replace(/\W+/g, ''));

          // undefined is ignored
          var objType = typeof value;
          switch (objType) {
            case 'boolean':
            case 'number':
            case 'string':
              {
                _pushProperty(curClass, _property(objType, key, false));
                break;
              }
            case 'object':
              {
                if (value === null) {
                  _pushProperty(curClass, _property(objType, key, false));
                  _parse(value, propertyName, classList);
                } else {
                  if (Array.isArray(value)) {
                    for (var i = 0; i < value.length; i++) {
                      var el = value[i];
                      if (typeof el == 'object')
                        _parse(el, propertyName, classList);
                      else if (typeof el == 'boolean' || typeof el == 'number' || typeof el == 'string')
                        objType = typeof el;
                    }

                    _pushProperty(curClass, _property(objType, key, true));
                  } else {
                    _pushProperty(curClass, _property(objType, key, false));
                    _parse(value, propertyName, classList);
                  }
                }

                break;
              }
            case 'function':
              {
                break;
              }
            default:
              console.log(objType);
          }
        }
      }
    }
  };

  // Receives a json string (or object) and return
  // a list of _class(es) objects.
  json2poxo.classes = function(baseClassName, src) {
    if (typeof baseClassName !== 'string')
      throw new Error('Argument 1 has to be a string');

    var srcString;
    if (typeof src === 'object')
      srcString = JSON.stringify(src);
    else if (typeof src === 'string')
      srcString = src;
    else
      throw new Error('Argument 2 has to be a string or object');

    var result = null;
    try {
      result = parser.parse(srcString);
    } catch (e) {
      console.log(e.message);
      return;
    }

    var json = JSON.parse(srcString);
    var classList = [];
    _parse(json, baseClassName, classList);
    return classList;
  };

  // Convert one JSON object into an array of
  // _poxo objects
  json2poxo.toX = function(lang, className, params, obj) {
    if (typeof lang !== 'string')
      throw new Error('Argument 1 has to be a string');

    var language;
    try {
      language = require("./" + lang);
    } catch (e) {
      throw new Error('Could not load "' + lang + '" configuration');
    }

    if (typeof className !== 'string')
      throw new Error('Argument 2 has to be a string');

    var results = [];
    var classes = json2poxo.classes(className, obj);
    if (classes.length > 0) {
      for (var i = 0; i < classes.length; i++) {
        var cl = classes[i];

        for (var j = 0; j < cl.properties.length; j++) {
          var p = cl.properties[j];
          p.name = _parseName(p.name, language.reservedWords);
          p.type = language.types[p.type];
        }

        if (typeof language.classes !== 'undefined') {
          cl = language.classes(cl, params);
          var models = language.template(cl, _poxo);

          // template can return more than one source code (array)
          if (typeof models === 'object' && Array.isArray(models)) {
            for (var k = 0; k < models.length; k++) {
              var model = models[k];
              results.push(model);
            }
          }
        }
      }
    }
    return results;
  };

  var _configure = function(classes) {
    for (var i = 0; i < classes.length; i++) {
      var cl = classes[i];
      for (var j = 0; j < cl.properties.length; j++) {
        var p = cl.properties[j];
        p.name = _parseName(name);
      }
    }
  };

  var _capitalize = function(value) {
    if (typeof value !== 'string')
      throw new Error("Argument 1 has to be a string");
    if (value.length > 1)
      return value.charAt(0).toUpperCase() + value.toLowerCase().substring(1);
    else
      return value.toUpperCase();
  };

  var _parseName = function(name, reservedWords) {
    for (var i = 0; i < reservedWords.length; i++) {
      var reserved = reservedWords[i];
        if (name.toLowerCase() === reserved.toLowerCase()) {
          return "_" + name;
        }
    }

    return name;
  };

  var _clean = function(val)
  {
    return val.replace(" ", "_").replace("/[^A-Za-z0-9\-]/", "_");
  };

  var _normalize = function normalize(name)
  {
    return _clean(name.toLowerCase());
  };

  return json2poxo;
})(exports || {});
