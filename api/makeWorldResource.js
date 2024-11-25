ModTools.onModsLoaded(game => {
	for (let i = 0; i < Resources.worldResourcesInfo.length; i++) {
		let wr = Resources.worldResourcesInfo[i]
		let key = "buildableWorldResourcesInfo.json/" + wr.className + ".name"
		if (wr.name != null && common_Localize.defaultLocalizations.h[key] == null) {
			common_Localize.defaultLocalizations.h[key] = wr.name
		}
	}
})

// THIS ISNT READY!
if (false) Liquid.makeWorldResource = function(className, fields, spriteGather, spriteGrow, saveFunc, loadFunc, superClass) {
    var haxeClassName = "worldResources." + className;
    var internalClassName = "worldResources_" + className;
    var langPrefix = "worldResources/" + className + ".";
	var l_name = "buildableWorldResourcesInfo.json/" + className + ".name"
    
	var langDefaults = {
		management_header: "[0] Management",
		set_management_only_this: "Only set the management mode for this [0].",
		set_management_all: "Set the management mode for all [0]s.",

		resource_gatherers: "Gatherers",

		management_question_all: "What should [0] do with all [1]s?",
		management_question_only_this: "What should [0] do with this [1]?",

		resource_gather: "Gather",
		resource_protect: "Protect",
		resource_regrow: "[0] and Regrow",
		management_gather_all: "[0] all [1]s.",
		management_gather_only_this: "[0] this [1].",
		management_protect_all: "Don't [0] them; keep them as decoration.",
		management_protect_only_this: "Don't [0] it; keep it as decoration.",
		management_regrow_all: "[0] them, then let them regrow.",
		management_regrow_only_this: "[0] it, then let it regrow.",
		instant_uproot: "Uproot",
		really_uproot: "Really [0]?",
		instant_uproot_description: "[0] this [1].",
		prioritized_description: "[0] will [1] this [2] first. [Tap] to disable.",
		not_prioritized_description: "When prioritized, [0] will [1] this [2] first.",
		management_only_this: "Only set the management mode for this [0].",
		management_all: "Set the management mode for all [0]s.",
	}
	
	for (const [k, v] of Object.entries(langDefaults)) {
		if (common_Localize.defaultLocalizations.h[langPrefix+k] == null) {
			common_Localize.defaultLocalizations.h[langPrefix+k] = v
			common_LocalizeLoader.additionalLocalizations.h.en = `${langPrefix+k}|${v}\n${common_LocalizeLoader.additionalLocalizations.h.en}`
		}
	}
    
    //Choose super class based on buildinginfo.json info.
    if (superClass == undefined) {
        superClass = worldResources_LimitedWorldResource;
    }

    var fieldsObject = {};
    if (typeof fields === "function")
        fieldsObject = fields(superClass);
    else
        fieldsObject = fields;

    var can_regrow = spriteGrow != null;
    

    //Then build the class
    var constructorOfBuilding = fieldsObject["__constructor__"];
    if (constructorOfBuilding === undefined)
        constructorOfBuilding = function(game,id,city,world,position,worldPosition,stage,texture,amountOfResource,regrowTexture) {
            if(regrowTexture == null) {
                regrowTexture = spriteGrow;
            }
            if(amountOfResource == null) {
                amountOfResource = this.get_initialResources();
            }
            if(texture == null) {
                texture = spriteGather;
            }
            superClass.call(this,game,id,city,world,position,worldPosition,stage,texture,amountOfResource,regrowTexture);
            if(can_regrow){
	            this.managementMode = worldResources_ForestManagementMode.CutDownAndRegrow;
            } else {
	            this.managementMode = worldResources_ForestManagementMode.CutDownAndUproot;
            }
        };

    var newBuildingClass = window[internalClassName] = $hxClasses[haxeClassName] = constructorOfBuilding;
    newBuildingClass.__super__ = superClass;
    newBuildingClass.__name__ = haxeClassName;
    newBuildingClass.__interfaces__ = [];

    fieldsObject.__class__ = newBuildingClass;

    if(fieldsObject.get_initialResources == null){
        fieldsObject.get_initialResources = function(){
            return 200;
        }
    }

    if(fieldsObject.setManagementMode == null){
        fieldsObject.setManagementMode = function(mode,noRecursion) {
            if(noRecursion == null) {
                noRecursion = false;
            }
            this.managementMode = mode;
            if(!noRecursion && gui_UpgradeWindowParts.hasMultiUpgradeModeOn) {
                var _g = 0;
                var _g1 = this.city.permanents;
                while(_g < _g1.length) {
                    var permanent = _g1[_g];
                    ++_g;
                    if(permanent.is(newBuildingClass)) {
                        permanent.setManagementMode(mode,true);
                    }
                }
            }
        }
    }
    if(fieldsObject.get_doNotGather == null){
        fieldsObject.get_doNotGather = function() {
            return this.managementMode == worldResources_ForestManagementMode.Protect;
        }
    }
    if(can_regrow){
        if(fieldsObject.get_regrowSpeed == null){
            fieldsObject.get_regrowSpeed = function() {
                return 0.003;
            }
        }
        if(fieldsObject.get_destroyedOnEmpty == null){
            fieldsObject.get_destroyedOnEmpty = function() {
                return this.managementMode == worldResources_ForestManagementMode.CutDownAndUproot;
            }
        }
    }
    if(fieldsObject.get_name == null){
        fieldsObject.get_name = function(){
            return common_Localize.lo(l_name);
        }
    }
    if(fieldsObject.createMainWindowPart == null){
        fieldsObject.createMainWindowPart = function() {
            var _gthis = this;
            var gui = this.city.gui;
            if(Settings.language == "en") {
                gui.window.minWidth = 195;
            }
            superClass.prototype.createMainWindowPart.call(this);
            var titleContainer = gui_UpgradeWindowParts.createHeader(gui,common_Localize.lo(langPrefix+"management_header", [common_Localize.lo(l_name)]));
            gui_UpgradeWindowParts.addOneAndMaxButtons(gui,titleContainer,function() {
                gui_UpgradeWindowParts.hasMultiUpgradeModeOn = false;
                _gthis.reloadWindow();
            },function() {
                gui_UpgradeWindowParts.hasMultiUpgradeModeOn = true;
                _gthis.reloadWindow();
            },common_Localize.lo(langPrefix+"management_only_this", [common_Localize.lo(l_name).toLowerCase()]),function() {
                return "---";
            },function() {
                return common_Localize.lo(langPrefix+"management_all", [common_Localize.lo(l_name).toLowerCase()]) + (" (" + _gthis.city.simulation.stats.amountOfBuildingsOfType(constructorOfBuilding) + ").");
            },false);
			gui.windowAddInfoText(gui_UpgradeWindowParts.hasMultiUpgradeModeOn ? common_Localize.lo(langPrefix+"management_question_all", [common_Localize.lo(langPrefix+"resource_gatherers").toLowerCase(), common_Localize.lo(l_name).toLowerCase()]) + " " : common_Localize.lo(langPrefix+"management_question_only_this", [common_Localize.lo(langPrefix+"resource_gatherers").toLowerCase(), common_Localize.lo(l_name).toLowerCase()]) + " ");
			if (can_regrow) {
                gui_UpgradeWindowParts.createActivatableButton(gui,this.managementMode == worldResources_ForestManagementMode.CutDownAndRegrow,function() {
                    _gthis.setManagementMode(worldResources_ForestManagementMode.CutDownAndRegrow);
                    _gthis.reloadWindow();
                },common_Localize.lo(langPrefix+"resource_regrow", [common_Localize.lo(langPrefix+"resource_gather")]),gui_UpgradeWindowParts.hasMultiUpgradeModeOn ? common_Localize.lo(langPrefix+"management_regrow_all", [common_Localize.lo(langPrefix+"resource_gather")]) : common_Localize.lo(langPrefix+"management_regrow_only_this", [common_Localize.lo(langPrefix+"resource_gather")]));
			} else {
				gui_UpgradeWindowParts.createActivatableButton(gui,this.managementMode == worldResources_ForestManagementMode.CutDownAndUproot,function() {
					_gthis.setManagementMode(worldResources_ForestManagementMode.CutDownAndUproot);
					_gthis.reloadWindow();
				},common_Localize.lo(langPrefix+"resource_gather"),gui_UpgradeWindowParts.hasMultiUpgradeModeOn ? common_Localize.lo(langPrefix+"management_gather_all", [common_Localize.lo(langPrefix+"resource_gather"), common_Localize.lo(l_name).toLowerCase()]) : common_Localize.lo(langPrefix+"management_gather_only_this", [common_Localize.lo(langPrefix+"resource_gather"), common_Localize.lo(l_name).toLowerCase()]));
			}
            gui_UpgradeWindowParts.createActivatableButton(gui,this.managementMode == worldResources_ForestManagementMode.Protect,function() {
                _gthis.setManagementMode(worldResources_ForestManagementMode.Protect);
                _gthis.reloadWindow();
            },common_Localize.lo(langPrefix+"resource_protect"),gui_UpgradeWindowParts.hasMultiUpgradeModeOn ? common_Localize.lo(langPrefix+"management_protect_all", [common_Localize.lo(langPrefix+"resource_gather").toLowerCase()]) : common_Localize.lo(langPrefix+"management_protect_only_this", [common_Localize.lo(langPrefix+"resource_gather").toLowerCase()]));
            if (can_regrow) {
				gui_UpgradeWindowParts.createActivatableButton(gui,this.managementMode == worldResources_ForestManagementMode.CutDownAndUproot,function() {
					_gthis.setManagementMode(worldResources_ForestManagementMode.CutDownAndUproot);
					_gthis.reloadWindow();
				},common_Localize.lo(langPrefix+"resource_gather"),gui_UpgradeWindowParts.hasMultiUpgradeModeOn ? common_Localize.lo(langPrefix+"management_gather_all", [common_Localize.lo(langPrefix+"resource_gather"), common_Localize.lo(l_name).toLowerCase()]) : common_Localize.lo(langPrefix+"management_gather_only_this", [common_Localize.lo(langPrefix+"resource_gather"), common_Localize.lo(l_name).toLowerCase()]));
            }
			gui.windowInner.addChild(new gui_GUISpacing(gui.windowInner,new common_Point(2,4)));
        }
    }
    if(fieldsObject.createWindowAddBottomButtons == null){
        fieldsObject.createWindowAddBottomButtons = function() {
            var _gthis = this;
            var prioritizeButton = null;
            var isConfirmButton = false;
            prioritizeButton = this.city.gui.windowAddBottomButtons([{ text : this.materialsLeft <= 0 ? common_Localize.lo(langPrefix+"instant_uproot") : this.city.simulation.resourcePriorityManager.isPrioritized(this) ? common_Localize.lo("prioritized") : common_Localize.lo("prioritize"), onHover : function() {
                if(_gthis.materialsLeft <= 0 && can_regrow) {
                    if(!isConfirmButton) {
                        _gthis.city.gui.tooltip.setText(_gthis,common_Localize.lo(langPrefix+"instant_uproot_description", [common_Localize.lo(langPrefix+"instant_uproot"), common_Localize.lo(l_name).toLowerCase()]));
                    }
                } else if(_gthis.city.simulation.resourcePriorityManager.isPrioritized(_gthis)) {
                    _gthis.city.gui.tooltip.setText(_gthis,common_Localize.lo(langPrefix+"prioritized_description", [common_Localize.lo(langPrefix+"resource_gatherers"), common_Localize.lo(langPrefix+"resource_gather").toLowerCase(), common_Localize.lo(l_name).toLowerCase()]),common_Localize.lo("prioritized"));
                } else {
                    _gthis.city.gui.tooltip.setText(_gthis,common_Localize.lo(langPrefix+"not_prioritized_description", [common_Localize.lo(langPrefix+"resource_gatherers").toLowerCase(), common_Localize.lo(langPrefix+"resource_gather").toLowerCase(), common_Localize.lo(l_name).toLowerCase()]),common_Localize.lo("prioritize"));
                }
            }, action : function() {
                if(_gthis.materialsLeft <= 0) {
                    if(isConfirmButton) {
                        _gthis.city.gui.closeWindow();
                        _gthis.destroy();
                        _gthis.materialsLeft = 0;
                    } else {
                        prioritizeButton.setText(common_Localize.lo(langPrefix+"really_uproot", [common_Localize.lo(langPrefix+"instant_uproot")]));
                        isConfirmButton = true;
                    }
                } else if(_gthis.city.simulation.resourcePriorityManager.isPrioritized(_gthis)) {
                    _gthis.city.simulation.resourcePriorityManager.deprioritize(_gthis);
                    prioritizeButton.setText(common_Localize.lo("prioritize"));
                } else {
                    _gthis.city.simulation.resourcePriorityManager.prioritize(_gthis);
                    prioritizeButton.setText(common_Localize.lo("prioritized"));
                }
            }}])[0];
            var wereMaterialsLeft = this.materialsLeft <= 0;
            prioritizeButton.onUpdate = function() {
                if(_gthis.materialsLeft <= 0 != wereMaterialsLeft) {
                    if(_gthis.materialsLeft <= 0 && can_regrow) {
                        isConfirmButton = false;
                        prioritizeButton.setText(common_Localize.lo(langPrefix+"instant_uproot"));
                    } else if(_gthis.city.simulation.resourcePriorityManager.isPrioritized(_gthis)) {
                        prioritizeButton.setText(common_Localize.lo("prioritize"));
                    } else {
                        prioritizeButton.setText(common_Localize.lo("prioritized"));
                    }
                    wereMaterialsLeft = _gthis.materialsLeft <= 0;
                }
            };
        }
    }
    fieldsObject.save = function(queue) {
        superClass.prototype.save.call(this, queue);
        switch(this.managementMode){
            case worldResources_ForestManagementMode.Protect:
                queue.addInt(0);
                break;
            case worldResources_ForestManagementMode.CutDownAndUproot:
                queue.addInt(1);
                break;
            case worldResources_ForestManagementMode.CutDownAndRegrow:
                queue.addInt(2);
                break;
        }
        if(saveFunc != undefined){
            saveFunc.call(this, queue);
        }
    }
    fieldsObject.load = function(queue) {
        superClass.prototype.load.call(this, queue);
        let mode = queue.readInt();
        switch(mode){
            case 0:
                this.managementMode = worldResources_ForestManagementMode.Protect;
                break;
            case 1:
                this.managementMode = worldResources_ForestManagementMode.CutDownAndUproot;
                break;
            case 2:
                this.managementMode = worldResources_ForestManagementMode.CutDownAndRegrow;
                break;
        }
        if(loadFunc != undefined){
            loadFunc.call(this, queue);
        }
    }
    newBuildingClass.prototype = $extend(superClass.prototype, fieldsObject);

    return newBuildingClass;
}