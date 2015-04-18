
module.exports = function(grunt){

	require("load-grunt-tasks")(grunt);

	var banner = grunt.template.process(
		grunt.file.read("./src/banner.js"),
		{data: grunt.file.readJSON("package.json")}
	);

	grunt.initConfig({
		concat: {
			build: {
				options: {banner: banner},
				files: {
					"dist/latte.js": ["src/latte.js"]
				}
			}
		},
		uglify: {
			build: {
				options: {banner: banner},
				files: {
					"dist/latte.min.js": ["src/latte.js"]
				}
			}
		}
	});

	grunt.registerTask("build", ["concat:build", "uglify:build"]);

};
