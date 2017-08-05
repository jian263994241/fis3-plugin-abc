

var JavaScriptObfuscator = require('javascript-obfuscator');


module.exports = function(content, file, settings) {

  if(typeof file.guard === 'undefined'){
    file.guard = true;
  }

  //Low obfuscation, High performance
  //Medium obfuscation, optimal performance
  //High obfuscation, low performance
  var preset = {
    high: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 1,
        debugProtection: true,
        debugProtectionInterval: true,
        disableConsoleOutput: true,
        mangle: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'rc4',
        stringArrayThreshold: 1,
        unicodeEscapeSequence: false
    },
    medium: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: true,
        mangle: false,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
    },
    low: {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: false,
      disableConsoleOutput: true,
      mangle: true,
      rotateStringArray: true,
      selfDefending: true,
      stringArray: true,
      stringArrayEncoding: false,
      stringArrayThreshold: 0.75,
      unicodeEscapeSequence: false
    }
  }

  var level = settings.level || 'low';

  if(!file.guard) return content;

  var opt = preset[level];

  var ObfuscationResult = JavaScriptObfuscator.obfuscate(file.getContent(), opt);

  content = ObfuscationResult.getObfuscatedCode();

  return content;
};
