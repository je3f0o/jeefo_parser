/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-01-23
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

const State                    = require("./src/state"),
      assign                   = require("jeefo_utils/object/assign"),
      UnexpectedTokenException = require("./src/unexpected_token_exception");

const TERMINATOR_PRECEDENCE = 0;

class JeefoParser {
	/**
     * @Validators
	 * @param: language (String)
	 * @param: tokenizer (JeefoTokenizer)
	 * @param: symbol_table (JeefoSymbolTable)
	 */
	constructor (language, tokenizer, symbol_table) {
		this.language     = language;
		this.tokenizer    = tokenizer;
		this.symbol_table = symbol_table;

        this.is_terminated    = null;
        this.current_symbol   = null;
        this.previous_symbols = null;

		this.next_token             = null;
        this.next_symbol_definition = null;

        this.state         = new State();
        this.current_state = this.state.default;
	}

	prepare_next_symbol_definition () {
		this.next_token = this.tokenizer.get_next_token();

		if (this.next_token) {
			this.next_symbol_definition = this.symbol_table.get_symbol_definition(this.next_token, this);
            if (typeof this.onpreparation === "function") {
                this.onpreparation(this);
            }
		} else {
			this.next_symbol_definition = null;
		}
	}

    prepare_next_state (state_name, throw_end_of_stream) {
        this.is_terminated    = false;
        this.current_symbol   = null;
        this.previous_symbols = [];

        this.current_state = state_name ? this.state.get_value(state_name) : this.state.default;
		this.prepare_next_symbol_definition();

        if (throw_end_of_stream && this.next_token === null) {
            this.throw_unexpected_end_of_stream();
        }
    }

    change_state (state_name) {
        this.current_state          = this.state.get_value(state_name);
        this.next_symbol_definition = this.symbol_table.get_symbol_definition(this.next_token, this);
    }

	terminate (symbol) {
        if (symbol === undefined) {
            throw new Error("Undefined termination");
        }

        this.is_terminated          = true;
		this.next_token             = null;
        this.next_symbol_definition = null;
        assign(this.tokenizer.streamer.cursor, symbol.end);
	}

	get_next_symbol (left_precedence) {
		if (typeof left_precedence !== "number") {
			throw new Error("Invalid left precedence");
		}

		while (this.next_token) {
            if (this.next_symbol_definition === null) {
                this.throw_unexpected_token();
            }
            if (this.next_symbol_definition.precedence <= left_precedence) {
                break;
            }

            const current_token = this.next_token;
			this.current_symbol = this.next_symbol_definition.generate_new_symbol(this);
            this.previous_symbols.push(this.current_symbol);

            if (current_token === this.next_token) {
                this.prepare_next_symbol_definition();
            }
		}

		return this.current_symbol;
	}

	parse (script, tab_size) {
		const symbols = [];
		this.tokenizer.init(script, tab_size);

        this.prepare_next_state();

		while (this.next_token) {
            const symbol = this.get_next_symbol(TERMINATOR_PRECEDENCE);
            if (symbol) {
                symbols.push(symbol);
            } else {
                this.throw_unexpected_token();
            }

            this.prepare_next_state();
		}

		return symbols;
	}

    expect (expectation, condition) {
        if (! condition(this)) {
            this.throw_unexpected_token(`Expected ${ expectation } instead saw: ${ this.next_token.value }`);
        }
    }

	throw_unexpected_token (error_message) {
		throw new UnexpectedTokenException(this, error_message);
	}

	throw_unexpected_end_of_stream () {
		throw new SyntaxError("Unexpected end of stream");
	}
}

JeefoParser.prototype.onpreparation = null;

module.exports = JeefoParser;
