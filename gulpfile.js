const gulp = require("gulp"),
	path = require("path"),
	fs = require("fs");

const plugins = ((keys) => {
        var obj = {};
        for (let i = 0, l = keys.length; i < l; ++i) {
            obj[keys[i]] = require(["gulp", keys[i]].join("-"));
        }
        return obj;
    })([
		"babel",
		"beautify",
		"concat",
		"optimize-js",
		"replace",
		"strip-comments",
		"uglify",
		"wrap"
    ]);

gulp.task("script", () => {

	const SRC_PATHS = [
                    "constants",
                    "helpers",
                    "constructor"
                ].map((s) => path.join(__dirname, "src", s + ".js"));

	const DEST_PATH = path.join(__dirname, "build");

    let getSrc = (name, transpile) => {
			let stream = gulp.src(SRC_PATHS)
					.pipe(plugins.concat(name + ".js"))
					.pipe(plugins.wrap({
						src: path.join(__dirname, "src", "IIFE.tmpl.js")
					}));

			return (!transpile)
				? stream
				: stream.pipe(plugins.babel({
						plugins: [
								"arrow-functions",
								"block-scoping",
								"parameters",
								"template-literals"
							].map((s) => ["transform", "es2015", s].join("-")),
						retainLines: true
					}));
		};

	// minified
	getSrc("DataCache.min", true)
		.pipe(plugins.uglify())
		.pipe(plugins["optimize-js"]())
        .pipe(gulp.dest(DEST_PATH));

	// non-minified, but commentless
	getSrc("DataCache", true)
		.pipe(plugins["strip-comments"]())
		.pipe(plugins["replace"](/\n{3,}/g, "\n\n"))
		.pipe(plugins.beautify({
			eol: "\n",
			indent_with_tabs: true,
			operator_position: "after-newline",
			wrap_line_length: 96
		}))
		.pipe(plugins["optimize-js"]())
		.pipe(gulp.dest(DEST_PATH));

});

gulp.task("default", [ "script" ]);
