/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : ast_node_definition.js
* Created at  : 2019-01-26
* Updated at  : 2019-08-06
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals*/
/* exported*/

// ignore:end

const assign    = require("@jeefo/utils/object/assign");
const readonly  = require("@jeefo/utils/object/readonly");
const IAST_Node = require("./i_ast_node");

class AST_Node_Definition {
	/**
     * @param symbol_definition {Object} - Symbol definition
	 */
	constructor (ast_node_definition) {
        if (typeof ast_node_definition.id !== "string") {
            throw new Error("Invalid argument: ast_node_definition.id");
        }
        if (typeof ast_node_definition.type !== "string") {
            throw new Error("Invalid argument: ast_node_definition.type");
        }
        if (typeof ast_node_definition.precedence !== "number") {
            throw new Error("Invalid argument: ast_node_definition.precedence");
        }
        if (typeof ast_node_definition.is !== "function") {
            throw new Error("Invalid argument: ast_node_definition.is");
        }
        if (typeof ast_node_definition.initialize !== "function") {
            console.log(222, ast_node_definition);
            throw new Error("Invalid argument: ast_node_definition.initialize");
        }

        class AST_Node extends IAST_Node {}
        // Cheap and simple way
        // TODO: think about class_extender helper function
		assign(AST_Node.prototype, {
			id         : ast_node_definition.id,
			type       : ast_node_definition.type,
			precedence : ast_node_definition.precedence,
		});
		this.AST_Node = AST_Node;

        ["id", "type", "precedence"].forEach(prop => {
            const value = ast_node_definition[prop];
            readonly(this, prop, value);
            //readonly(AST_Node.prototype, prop, value, false);
        });

        ["is", "initialize"].forEach(prop=> {
            this[prop] = ast_node_definition[prop];
        });
	}

	generate_new_node (parser) {
		const ast_node = new this.AST_Node();
        // Only dev mode
        ast_node.id         = this.id;
        ast_node.type       = this.type;
        ast_node.precedence = this.precedence;
        // Only dev mode
		this.initialize(ast_node, parser.next_token, parser);

		return ast_node;
	}
}

module.exports = AST_Node_Definition;
