/*
MIT License

Copyright (c) 2021 webketje
Copyright (c) 2014-2021 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* A copy of @metalsmith/markdown. This is added to the project to update
 * dependent libraries to remove warnings about vulnerabilities. Also, this
 * does not rename *.md to *.html any longer. */

const pluginName = "metalsmith-site/plugins/markdown";
const { basename, dirname, extname, join } = require("path");
const debug = require("debug")(pluginName);
const marked = require("marked");
const metalsmithPluginKit = require("metalsmith-plugin-kit");

/**
 * @typedef Options
 * @property {String[]} keys - Key names of file metadata to render to HTML
 **/

/**
 * Don't encode within handlebars
 *
 * Based on https://github.com/markedjs/marked/issues/269#issuecomment-1173177983
 */
const handlebarsTagLiteralRule = /^\{\{(?:\{.*?\}|.*?)\}\}+/; // Regex for the complete token, anchor to string start
const handlebarsTagLiteral = {
    name: "handlebarsTag",
    level: "inline",
    start: (src) => src.indexOf("{{"), // Hint to Marked.js to stop and check for a match
    tokenizer: (src, tokens) => {
        const match = handlebarsTagLiteralRule.exec(src);

        if (match) {
            return {
                // Token to generate
                type: "handlebarsTag", // Should match "name" above
                raw: match[0], // Text to consume from the source
                text: match[0] // Additional custom properties
            };
        }
    },
    renderer: (token) => token.text
};
marked.use({ extensions: [handlebarsTagLiteral]});

/**
 * Metalsmith plugin to convert markdown files.
 * @param {Options} [options]
 * @return {import('metalsmith').Plugin}
 */
const plugin = function (options) {
    options = options || {};
    const keys = options.keys || [];

    return metalsmithPluginKit.middleware({
        each: (file, data, files) => {
            const dir = dirname(file);

            debug("Converting file: %s", file);
            const str = marked.parse(data.contents.toString(), options);
            data.contents = Buffer.from(str);

            for (const key of keys) {
                if (data[key]) {
                    data[key] = marked.parse(data[key].toString(), options);
                }
            }
        },
        match: "**/*.md",
        name: pluginName
    });
};

module.exports = plugin;
