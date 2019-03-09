/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : symbol_definition.js
* Created at  : 2019-01-26
* Updated at  : 2019-03-09
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

// ignore:end

const assign       = require("jeefo_utils/object/assign"),
      IJeefoSymbol = require("./i_jeefo_symbol");

module.exports = class SymbolDefinition {
	/**
	 * @param: symbol_definition (Object)
	 * @param: symbol_definition.id (String)
	 * @param: symbol_definition.type (String)
	 * @param: symbol_definition.precedence (Number)
	 * @param: symbol_definition.operator_type (Enum{ null, "prefix", "infix", "postfix" })
	 * @param: symbol_definition.initialize (Function)
	 */
	constructor (symbol_definition) {
        if (typeof symbol_definition.id !== "string") {
            throw new Error("Invalid argument: symbol_definition.id");
        }
        if (typeof symbol_definition.type !== "string") {
            throw new Error("Invalid argument: symbol_definition.type");
        }
        if (typeof symbol_definition.precedence !== "number") {
            throw new Error("Invalid argument: symbol_definition.precedence");
        }
        if (typeof symbol_definition.is !== "function") {
            throw new Error("Invalid argument: symbol_definition.is");
        }
        if (typeof symbol_definition.initialize !== "function") {
            throw new Error("Invalid argument: symbol_definition.initialize");
        }

		this.Symbol = class JeefoSymbol extends IJeefoSymbol { };
		assign(this.Symbol.prototype, {
			id         : symbol_definition.id,
			type       : symbol_definition.type,
			precedence : symbol_definition.precedence,
		});

		assign(this, symbol_definition);
	}

	generate_new_symbol (parser) {
		const symbol = new this.Symbol();
		this.initialize(symbol, parser.next_token, parser);

		return symbol;
	}

	get_precedence () {
		return this.precedence;
	}
};
