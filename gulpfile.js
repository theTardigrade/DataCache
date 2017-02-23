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
		"optimize-js",
		"rename",
		"replace",
		"strip-comments",
		"uglify",
		"wrap"
    ]);

gulp.task("script", () => {

    let getSrc = () => {
			return gulp.src(path.join(__dirname, "src", "DataCache.js"))
				.pipe(plugins.wrap({
					src: path.join(__dirname, "src", "IIFE.tmpl.js")
				}))
				.pipe(plugins.babel({
					plugins: [
							"arrow-functions",
							"block-scoping",
							"template-literals"
						].map((s) => ["transform", "es2015", s].join("-")),
					retainLines: true
			}));
		};

	// minified
	getSrc()
		.pipe(plugins.uglify())
		.pipe(plugins["optimize-js"]())
		.pipe(plugins.rename("DataCache.min.js"))
        .pipe(gulp.dest(path.join(__dirname, "build")));

	// non-minified, but commentless
	getSrc()
		.pipe(plugins["strip-comments"]())
		.pipe(plugins["replace"](/\n{3,}/g, "\n\n"))
		.pipe(plugins.beautify({
			eol: "\n",
			indent_with_tabs: true,
			operator_position: "after-newline",
			wrap_line_length: 96
		}))
		.pipe(plugins["optimize-js"]())
		.pipe(gulp.dest(path.join(__dirname, "build")));

});

gulp.task("default", [ "script" ]);
