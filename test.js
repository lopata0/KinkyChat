import natural from 'natural';
const { WordTokenizer } = natural;

const tokenizer = new WordTokenizer();


function extractCoins(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    const amounts = [];

    for (let i = 0; i < tokens.length; i++) {
        if (!isNaN(tokens[i])) {
            // Check if next word is "coin" or "coins"
            if (i < tokens.length - 1 && tokens[i + 1].includes('coin')) {
                amounts.push(parseInt(tokens[i]));
            }
        }
    }

    return amounts;
}

console.log(extractCoins("*i reach my pocket and hand you some coins* heres your 5 little coins"))