/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2019-01-23
* Updated at  : 2019-08-30
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const JeefoTokenizer           = require("@jeefo/tokenizer");
const assign                   = require("@jeefo/utils/object/assign");
const for_each                 = require("@jeefo/utils/object/for_each");
const State                    = require("./src/state");
const I_AST_Node               = require("./src/i_ast_node");
const AST_Node_Table           = require("./src/ast_node_table");
const AST_Node_Definition      = require("./src/ast_node_definition");
const UnexpectedTokenException = require("./src/unexpected_token_exception");

const TERMINATOR_PRECEDENCE  = 0;
const object_define_property = Object.defineProperty;

class JeefoParser {
    static get JeefoTokenizer      () { return JeefoTokenizer;      }
    static get I_AST_Node          () { return I_AST_Node;          }
    static get AST_Node_Table      () { return AST_Node_Table;      }
    static get AST_Node_Definition () { return AST_Node_Definition; }

    static get UnexpectedTokenException () {
        return UnexpectedTokenException;
    }

    /**
     * @Validators
     * @param: language (String)
     * @param: tokenizer (JeefoTokenizer)
     * @param: ast_node_table (AST_Node_Table)
     */
    constructor (language, tokenizer, ast_node_table) {
        if (typeof language !== "string") {
            throw new TypeError("Invalid argument: language");
        }
        if (! (tokenizer instanceof JeefoTokenizer)) {
            throw new TypeError("Invalid argument: tokenizer");
        }
        if (! (ast_node_table instanceof AST_Node_Table)) {
            throw new TypeError("Invalid argument: ast_node_table");
        }

        this.language       = language;
        this.tokenizer      = tokenizer;
        this.ast_node_table = ast_node_table;

        this.debug          = false;
        this.prev_node      = null;
        this.ending_index   = 0;
        this.is_terminated  = null;
        this.previous_nodes = null;

        this.next_token           = null;
        this.next_node_definition = null;

        this.state         = new State();
        this.current_state = this.state.default;

        let onpreparation = null;
        object_define_property(this, "onpreparation", {
            get () { return onpreparation; },
            set (value) {
                if (typeof value !== "function") {
                    throw new TypeError(
                        "Assigned onpreparation is not a function"
                    );
                }
                onpreparation = value;
            }
        });
    }

    look_ahead (throw_end_of_stream) {
        const {
            next_token           : current_token,
            next_node_definition : current_node_def,
            prev_node, previous_nodes
        } = this;

        this.tokenizer.streamer.cursor.save();
        this.prev_node      = null;
        this.previous_nodes = [];
        this.prepare_next_node_definition(throw_end_of_stream);
        const next_token = this.next_token;

        this.tokenizer.streamer.cursor.rollback();
        this.prev_node            = prev_node;
        this.next_token           = current_token;
        this.previous_nodes       = previous_nodes;
        this.next_node_definition = current_node_def;

        return next_token;
    }

    prepare_next_node_definition (throw_end_of_stream) {
        this.next_token = this.tokenizer.get_next_token();

        if (this.next_token) {
            // Only dev mode
            if (this.next_token) {
                this.next_token.id       = this.next_token.id;
                this.next_token.priority = this.next_token.priority;
            }
            // Only dev mode

            if (this.onpreparation) {
                this.onpreparation(this);
            }
            if (! this.is_terminated && this.next_token) {
                this.next_node_definition = this.ast_node_table.find(
                    this.next_token, this
                );
            } else {
                this.next_node_definition = null;
            }
        } else if (throw_end_of_stream) {
            this.throw_unexpected_end_of_stream();
        } else {
            this.next_node_definition = null;
        }
    }

    prepare_next_state (state_name, throw_end_of_stream) {
        this.prev_node            = null;
        this.is_terminated        = false;
        this.previous_nodes       = [];
        this.next_node_definition = null;

        if (state_name) {
            this.current_state = this.state.get_value(state_name);
        } else {
            this.current_state = this.state.default;
        }
        this.prepare_next_node_definition(throw_end_of_stream);
    }

    generate_next_node () {
        if (! this.next_node_definition) {
            this.throw_unexpected_token("AST_Node_Definition is not found");
        }
        return this.next_node_definition.generate_new_node(this);
    }

    change_state (state_name) {
        this.current_state        = this.state.get_value(state_name);
        this.next_node_definition = this.ast_node_table.find(
            this.next_token, this
        );
    }

    terminate (node) {
        if (node === undefined) {
            if (this.debug) { console.log(this); }
            throw new Error("argument must be AST_Node object.");
        }

        this.is_terminated        = true;
        this.next_token           = null;
        this.next_node_definition = null;
        assign(this.tokenizer.streamer.cursor.position, node.end);
    }

    parse_next_node (left_precedence) {
        if (typeof left_precedence !== "number") {
            if (this.debug) { console.log(this); }
            throw new Error("Invalid left precedence");
        }

        while (this.next_token) {
            if (this.next_node_definition === null) {
                if (this.throw_not_found) {
                    this.throw_unexpected_token(
                        "AST_Node_Definition is not found"
                    );
                }
                break;
            }
            if (this.next_node_definition.precedence <= left_precedence) {
                break;
            }

            this.ending_index = this.next_token.end.index;
            this.set_prev_node(this.generate_next_node());

            if (
                this.debug && [null, undefined].includes(this.current_state)
            ) {
                this.throw_unexpected_token("Invalid current_state");
            }

            if (this.next_token) {
                if (this.next_token.end.index === this.ending_index) {
                    this.prepare_next_node_definition();
                } else {
                    this.next_node_definition = this.ast_node_table.find(
                        this.next_token, this
                    );
                }
            }
        }

        return this.prev_node;
    }

    parse (script, tab_size) {
        const nodes = [];
        this.tokenizer.init(script, tab_size);

        this.prepare_next_state();

        while (this.next_token) {
            const node = this.parse_next_node(TERMINATOR_PRECEDENCE);
            if (node) {
                nodes.push(node);
            } else {
                this.throw_unexpected_token("AST_Node is not found.");
            }

            this.prepare_next_state();
        }

        return nodes;
    }

    is_next_node (id) {
        if (this.next_node_definition) {
            return this.next_node_definition.id === id;
        }
        return false;
    }

    set_prev_node (prev_node) {
        this.prev_node = prev_node;
        this.previous_nodes.push(prev_node);
    }

    get_current_state_name () {
        const { current_state, state : { values } } = this;

        return Object.keys(values).find(state_name => {
            return values[state_name] === current_state;
        });
    }

    is_reserved_word (value) {
        return this.ast_node_table.reserved_words[value] !== undefined;
    }

    expect (expectation, condition) {
        if (! condition(this)) {
            const { streamer } = this.tokenizer;
            this.throw_unexpected_token(
                `Expected ${ expectation } instead saw: ${
                    streamer.substring_from_token(this.next_token)
                }`
            );
        }
    }

    throw_unexpected_token (error_message, token) {
        if (token) {
            this.next_token = token;
        }
        if (this.debug) { console.log(this); }
        throw new UnexpectedTokenException(this, error_message);
    }

    throw_unexpected_end_of_stream () {
        if (this.debug) { console.log(this); }
        throw new SyntaxError("Unexpected end of stream");
    }

    clone (name) {
        name = name || this.name;
        const tokenizer      = new JeefoTokenizer();
        const ast_node_table = new AST_Node_Table();

        this.tokenizer.token_definitions.forEach(td => {
            tokenizer.register({
                id         : td.Token.prototype.id,
                priority   : td.Token.prototype.priority,
                is         : td.is,
                initialize : td.initialize,
            });
        });

        const { reserved_words, node_definitions } = this.ast_node_table;

        const defs = [];
        for_each(reserved_words, (word, node_def) => {
            const def = defs.find(d => d.node_def === node_def);

            if (def) {
                def.words.push(word);
            } else {
                defs.push({ words: [word], node_def });
            }
        });

        defs.forEach(def => {
            ast_node_table.register_reserved_words(def.words, def.node_def);
        });

        ast_node_table.node_definitions = node_definitions.map(def => {
            return new AST_Node_Definition(def);
        });

        const clone  = new JeefoParser(name, tokenizer, ast_node_table);
        Object.assign(clone.state.values, this.state.values);
        clone.state.default = this.state.default;

        if (this.onpreparation) {
            clone.onpreparation = this.onpreparation;
        }

        return clone;
    }
}

module.exports = JeefoParser;
