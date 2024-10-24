Liquid.addCheckboxSetting = function(name, defaultValue, onChange, id=name) {
	Liquid._addSetting(Liquid.getModID(1), id, {
		type: "checkbox",
		label: name,
		value: defaultValue,
		callback: onChange,
	})
}
Liquid.addSliderSetting = function(name, defaultValue, min, max, step, onChange, id=name, isPercent=false) {
	Liquid._addSetting(Liquid.getModID(1), id, {
		type: "slider",
		label: name,
		value: defaultValue,
		min: min,
		max: max,
		step: step,
		callback: onChange,
		percent: isPercent
	})
}
Liquid.addMenuSetting = function(name, defaultValue, options, onChange, id=name) {
	Liquid._addSetting(Liquid.getModID(1), id, {
		type: "menu",
		label: name,
		value: defaultValue,
		options: options,
		callback: onChange,
	})
}