

var JavaScriptObfuscator = require('javascript-obfuscator');


module.exports = function(content, file, settings) {

  if(typeof file.guard === 'undefined'){
    file.guard = true;
  }

  if(!file.guard) return content;

  var opt = Object.assign({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: true,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
    }, settings.option);

  var ObfuscationResult = JavaScriptObfuscator.obfuscate(file.getContent(), opt);

  content = ObfuscationResult.getObfuscatedCode();

  return content;
};
