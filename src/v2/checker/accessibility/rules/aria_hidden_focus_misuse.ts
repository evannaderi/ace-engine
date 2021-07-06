/******************************************************************************
     Copyright:: 2020- IBM, Inc

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

    import { Rule, RuleResult, RuleFail, RuleContext, RulePotential, RuleManual, RulePass } from "../../../api/IEngine";
    import { RPTUtil } from "../util/legacy";
    import { DOMUtil } from "../../../dom/DOMUtil";
    
    let ariaHiddenRule : Rule[] = [
                
    {
        /**
         * Description: This rule checks that elements with an aria-hidden attribute do not contain focusable elements
         * Origin: ACT https://act-rules.github.io/rules/6cfa84
         */
        id: "aria_hidden_focus_misuse",
        context: "dom:*[aria-hidden=true], dom:*[aria-hidden=true] dom:*",
        run: (context: RuleContext, options?: {}) : RuleResult | RuleResult[] => {
            const ruleContext = context["dom"].node as Element;
            
            let nodeName = ruleContext.nodeName.toLowerCase();
            if (RPTUtil.isTabbable(ruleContext))
                return RuleFail("Fail_1", [nodeName]);
            
            return RulePass("Pass_0");
                
        }        
    }]

    export { ariaHiddenRule }