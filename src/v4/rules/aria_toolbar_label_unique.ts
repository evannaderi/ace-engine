/******************************************************************************
  Copyright:: 2022- IBM, Inc
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*****************************************************************************/

import { Rule, RuleResult, RuleFail, RuleContext, RulePotential, RuleManual, RulePass, RuleContextHierarchy } from "../api/IRule";
import { eRulePolicy, eToolkitLevel } from "../api/IRule";
import { RPTUtil } from "../../v2/checker/accessibility/util/legacy";
import { getCache, setCache } from "../util/CacheUtil";

export let aria_toolbar_label_unique: Rule = {
    id: "aria_toolbar_label_unique",
    context: "aria:toolbar",
    refactor: {
        "Rpt_Aria_MultipleToolbarUniqueLabel": {
            "Pass_0": "Pass_0",
            "Fail_1": "Fail_1"}
    },
    help: {
        "en-US": {
            "Pass_0": "aria_toolbar_label_unique.html",
            "Fail_1": "aria_toolbar_label_unique.html",
            "group": "aria_toolbar_label_unique.html"
        }
    },
    messages: {
        "en-US": {
            "Pass_0": "Rule Passed",
            "Fail_1": "Multiple elements with \"toolbar\" roles do not have unique labels",
            "group": "Each element with \"toolbar\" role must have a unique label that describes its purpose"
        }
    },
    rulesets: [{
        "id": ["IBM_Accessibility", "IBM_Accessibility_next", "WCAG_2_1", "WCAG_2_0", "WCAG_2_2"],
        "num": ["2.4.1"], //updated mapping to match other landmark regions rules
        "level": eRulePolicy.VIOLATION,
        "toolkitLevel": eToolkitLevel.LEVEL_ONE
    }],
    act: [],
    run: (context: RuleContext, options?: {}, contextHierarchies?: RuleContextHierarchy): RuleResult | RuleResult[] => {
        const ruleContext = context["dom"].node as Element;
        // Consider the Check Hidden Content setting that is set by the rules
        // Also, consider Implicit role checking.
        let landmarks = RPTUtil.getElementsByRoleHidden(
            ruleContext.ownerDocument,
            "toolbar",
            true,
            true
        );
        if (landmarks.length === 0 || landmarks.length === 1) {
            return null;
        }

        let dupes = getCache(
            ruleContext.ownerDocument,
            "aria_toolbar_label_unique",
            null
        );
        if (!dupes) {
            dupes = RPTUtil.findAriaLabelDupes(landmarks);
            setCache(
                ruleContext.ownerDocument,
                "aria_toolbar_label_unique",
                dupes
            );
        }
        let myLabel = RPTUtil.getAriaLabel(ruleContext);
        let passed =
            myLabel !== "" && (!(myLabel in dupes) || dupes[myLabel] <= 1);

        if (!passed) {
            return RuleFail("Fail_1", [myLabel]);
        } else {
            return RulePass("Pass_0");
        }
    }
}