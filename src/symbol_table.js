/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : symbol_table.js
* Created at  : 2017-08-16
* Updated at  : 2019-02-21
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const SymbolDefinition = require("./symbol_definition");

module.exports = class SymbolTable {
	constructor () {
        this.reserved_words     = Object.create(null);
		this.symbol_definitions = [];
	}

    get_reserved_words () {
        return Object.keys(this.reserved_words);
    }

	register_symbol_definition (symbol_definition) {
		this.symbol_definitions.push(new SymbolDefinition(symbol_definition));
		this.symbol_definitions.sort((a, b) => a.precedence - b.precedence);
	}

	register_reserved_word (word, symbol_definition) {
        if (this.reserved_words[word]) {
            throw new Error("Duplicated reserved word detected");
        }
        this.reserved_words[word] = new SymbolDefinition(symbol_definition);
	}

	register_reserved_words (words, symbol_definition) {
        symbol_definition = new SymbolDefinition(symbol_definition);

        words.forEach(word => {
            if (this.reserved_words[word]) {
                throw new Error("Duplicated reserved word detected");
            }
            this.reserved_words[word] = symbol_definition;
        });
	}

	get_symbol_definition (token, parser) {
        if (typeof token.value !== "string") {
            throw new Error("Invalid argument: token.value");
        }
        if (this.reserved_words[token.value] !== undefined) {
            if (this.reserved_words[token.value].is(token, parser)) {
                return this.reserved_words[token.value];
            }
        }

		const symbol_definitions = this.symbol_definitions;

		let i = symbol_definitions.length;
		while (i--) {
			if (symbol_definitions[i].is(token, parser)) {
				return symbol_definitions[i];
			}
            if (parser.is_terminated) {
                return null;
            }
		}

        return null;
	}
};
