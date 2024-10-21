if (true) {
	function costProp(makeFromInfo) {
		return function(info) {
			if (info.cost == null) {
				return makeFromInfo(info)
			} else {
				return makeFromInfo(info.cost)
			}
		}
	}
	Materials.fromBuildingInfo = costProp(Materials.fromBuildingInfo)
	Materials.fromBuildingUpgradesInfo = costProp(Materials.fromBuildingUpgradesInfo)
	Materials.fromCityUpgradesInfo = costProp(Materials.fromCityUpgradesInfo)
	Materials.fromPoliciesInfo = costProp(Materials.fromPoliciesInfo)
	Materials.fromDecorationInfo = costProp(Materials.fromDecorationInfo)
	Materials.fromWorldResourceInfo = costProp(Materials.fromWorldResourceInfo)
	Materials.fromBridgeInfo = costProp(Materials.fromBridgeInfo)
}

if (false) {
	Builder.prototype.buildingPrerequirementsValid = function(orig) {
		return function() {
			// add limited requirement
			if (this.builderType._hx_index == 0) {
				if (this.builderType.buildingInfo[features.limited] != null) {
					if (Lambda.count(this.city.permanents, (pm) => {
						return pm.is(this.get_buildingToBuild())
					}) >= this.builderType.buildingInfo[features.limited]) {
						return false
					}
				}
			}
			// call original
			return orig.call(this)
		}
	} (Builder.prototype.buildingPrerequirementsValid)
	// its very hacky but it works
	// modify the existing function to add a hook
	gui_BuildingButtons.prototype.showBuildingTooltip = Function("return "+gui_BuildingButtons.prototype.showBuildingTooltip.toString().replace("if(continousDisplay) {", "this.customExtraInfo(extraInfo,buildingInfo,buildingType,tooltipContext,continousDisplay)\nif(continousDisplay) {"))()
	gui_BuildingButtons.prototype.customExtraInfo = function(extraInfo, buildingInfo, buildingType, tooltipContext, continousDisplay) {
		// add limited info
		if (buildingInfo[features.limited] != null) {
			var tmp = Resources.getTexture("spr_uniquebuilding")
			var text2 = common_Localize.lo("limitedBuilding", [buildingInfo[features.limited]])
			extraInfo.push({ texture : tmp, text : Lambda.count(this.city.permanents,function(pm) {
				return pm.is(buildingType)
			}) >= buildingInfo[features.limited] ? "[red]" + text2 : text2})
		}
	}
}