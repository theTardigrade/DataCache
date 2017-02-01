const gulp = require("gulp"),
	path = require("path");

const plugins = ((keys) => {
        var obj = {};
        for (let i = 0, l = keys.length; i < l; ++i) {
            obj[keys[i]] = require(["gulp", keys[i]].join("-"));
        }
        return obj;
    })([
		"babel",
		"optimize-js",
		"uglify",
    ]);

gulp.task("script", () => {

    return gulp.src(path.join(__dirname, "src", "DataCache.js"))
		.pipe(plugins.babel({ presets: "latest" }))
		.pipe(plugins.uglify())
		.pipe(plugins["optimize-js"]())
        .pipe(gulp.dest(path.join(__dirname, "build")));

});

gulp.task("default", [ "script" ]);
