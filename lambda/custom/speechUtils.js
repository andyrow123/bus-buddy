var speechUtils = (function () {
  return {
    formTextList: function(items) {
        if (items.length > 1) {
            var sentence = "<speak>The buses that stop at your set stop are";
        } else {
            var sentence = "<speak>The bus that stops at your set stop is";
        }
        var count = items.length;
    
        items.forEach(function(item, index) {
            if (index < items.length - 1 || items.length === 1) {
                var itemSpell = speechUtils.spellDigitOutput(item);
                sentence += " the " + itemSpell + " ";
            } else {
                var itemSpell = speechUtils.spellDigitOutput(item);
                sentence += " and the " + itemSpell + " ";
            }            
            
        });
        
        return sentence + "</speak>";
    },

    spellDigitOutput: function(number) {
        return "<say-as interpret-as='digits'>" + number + "</say-as>"; 
    }
  }
})();

exports.speechUtils = speechUtils;