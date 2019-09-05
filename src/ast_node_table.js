/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ast_node_table.js
* Created at  : 2017-08-16
* Updated at  : 2019-09-05
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const AST_Node_Definition = require("./ast_node_definition");

class AST_Node_Table {
	constructor () {
        this.reserved_words   = Object.create(null);
		this.node_definitions = [];
	}

    get_reserved_words () {
        return Object.keys(this.reserved_words).sort((a, b) => {
            return a.localeCompare(b);
        });
    }

	register_node_definition (node_definition) {
        const def = new AST_Node_Definition(node_definition);
        const other_def = this.node_definitions.find(other => {
            return other.id === def.id;
        });
        if (other_def) {
            throw new Error(`Duplicated AST_Node_Definition: ${ def.id }`);
        }
		this.node_definitions.push(def);
		this.node_definitions.sort((a, b) => a.precedence - b.precedence);
	}

	register_reserved_word (word, node_definition) {
        if (this.reserved_words[word]) {
            throw new Error(`Duplicated reserved word: ${ word }`);
        }
        this.reserved_words[word] = new AST_Node_Definition(node_definition);
	}

	register_reserved_words (words, node_definition) {
        node_definition = new AST_Node_Definition(node_definition);

        words.forEach(word => {
            if (this.reserved_words[word]) {
                throw new Error(`Duplicated reserved word: ${ word }`);
            }
            this.reserved_words[word] = node_definition;
        });
	}

	find (token, parser) {
        if (token.id === "Identifier") {
            const reserved_word_definition = this.reserved_words[token.value];
            const is_matched = (
                reserved_word_definition &&
                reserved_word_definition.is(token, parser)
            );

            if (is_matched) { return reserved_word_definition; }
        }

        const { node_definitions } = this;
		let i = node_definitions.length;
		while (i--) {
			if (node_definitions[i].is(token, parser)) {
				return node_definitions[i];
			}
            if (parser.is_terminated) { return null; }
		}

        return null;
	}

    remove_node_defs (defs) {
        defs.forEach(({ expression, reserved_word }) => {
            if (reserved_word) {
                delete this.reserved_words[reserved_word];
            } else {
                const index = this.node_definitions.findIndex(def => {
                    return def.id === expression;
                });
                if (index === -1) {
                    throw new Error(`Cannot find AST_Node_Definition: '${
                        expression
                    }' to remove`);
                }
                this.node_definitions.splice(index, 1);
            }
        });
    }
}

module.exports = AST_Node_Table;
