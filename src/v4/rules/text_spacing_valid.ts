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
import { VisUtil } from "../../v2/dom/VisUtil";
import { getDefinedStyles, getComputedStyle, convertValue2Pixels } from "../util/CSSUtil";

export let text_spacing_valid: Rule = {
    id: "text_spacing_valid",
    context: "dom:*",
    help: {
        "en-US": {
            "pass": "text_spacing_valid.html",
            "group": "text_spacing_valid.html",
            "potential_letter_spacing_style": "text_spacing_valid.html",
            "potential_word_spacing_style": "text_spacing_valid.html",
            "potential_line_height_style": "text_spacing_valid.html"
        }
    },
    messages: {
        "en-US": {
            "pass": "CSS is not used to control letter or word spacing or line height",
            "group": "Use CSS to control letter or word spacing or line height",
            "potential_letter_spacing_style": "Use CSS 'letter-spacing' to control letter spacing within a word",
            "potential_word_spacing_style": "Use CSS 'word-spacing' to control spacing between words",
            "potential_line_height_style": "Use CSS 'line-spacing' to control spacing between lines"
        }
    },
    rulesets: [{
        "id": ["IBM_Accessibility", "WCAG_2_1", "WCAG_2_0"],
        "num": ["1.4.12"],
        "level": eRulePolicy.VIOLATION,
        "toolkitLevel": eToolkitLevel.LEVEL_THREE
    }],
    act:['9e45ec', '24afc2'],
    run: (context: RuleContext, options?: {}, contextHierarchies?: RuleContextHierarchy): RuleResult | RuleResult[] => {
        const ruleContext = context["dom"].node as HTMLElement;
        let nodeName = ruleContext.nodeName.toLowerCase();

        //skip the check if the element is hidden or disabled
        if (VisUtil.isNodeHiddenFromAT(ruleContext) || RPTUtil.isNodeDisabled(ruleContext))
            return null;

        //skip the check if the element is off screen
        const bounds = context["dom"].bounds;
        //in case the bounds not available
        if (!bounds) return null;
        if (bounds['top'] < 0 || bounds['left'] < 0)
            return null;

        //skip no-html element
        if (RPTUtil.getAncestor(ruleContext, "svg"))
            return null;

        // Ensure that this element has children with actual text.
        let childStr = "";
        let childNodes = ruleContext.childNodes;
        for (let i = 0; i < childNodes.length; ++i) {
            if (childNodes[i].nodeType == 3) {
                childStr += childNodes[i].nodeValue;
            }
        }
        if (childStr.trim().length == 0)
            return null;

        //font size always resolved to 'px'    
        const font_size_style = getComputedStyle(ruleContext).getPropertyValue('font-size');
        var font_size = parseFloat(font_size_style); 
        
        const styles = getDefinedStyles(ruleContext);
        if (Object.keys(styles).length === 0)
            return null;
        
        //note that CSS unit is a requirement for non-zero values, otherwise it's ignored
        let ret = []; 
        // matched string: original style, the style value and unit
        const regex = /(-?[\d.]+)([a-z%]*)/;
        const word_style = styles['word-spacing'];
        if (word_style) {
            if (ruleContext.style.getPropertyPriority('word-spacing') === 'important') { 
                // computed space is 0 for 'normal' or 'initial'. The 'inherit' will be checked in the parents
                if (word_style === 'initial' || word_style === 'normal')
                    ret.push(RulePotential("potential_word_spacing_style"));
                else {
                    const wordSpacing = parseFloat(word_style);
                    if (!isNaN(wordSpacing)) {
                        let parsed = word_style.trim().match(regex);
                        if (parsed[2] !== '' && parsed[1] !== 0) { //no unit which is considered as error, so implicable
                            let pixels = convertValue2Pixels(parsed[2], parsed[1], ruleContext);
                            if (pixels != null && pixels/font_size < 0.16)
                                ret.push(RulePotential("potential_word_spacing_style"));
                            else
                                ret.push(RulePass("pass")); 
                        }  
                    } else
                        ret.push(RulePass("pass"));         
                } 
            } else
                ret.push(RulePass("pass"));  
        } 

        const letter_style = styles['letter-spacing'];
        if (letter_style) {
            if (ruleContext.style.getPropertyPriority('letter-spacing') === 'important') {
                // computed space is 0 for 'normal' or 'initial'. The 'inherit' will be checked in the parents
                if (letter_style === 'initial' || letter_style === 'normal')
                    ret.push(RulePotential("potential_letter_spacing_style"));
                else {    
                    const letterSpacing = parseFloat(letter_style);
                    if (!isNaN(letterSpacing)) {
                        let parsed = letter_style.trim().match(regex);
                        if (parsed[2] !== '' && parsed[1] !== 0) { //no unit which is considered as error, so implicable
                            let pixels = convertValue2Pixels(parsed[2], parsed[1], ruleContext);
                            if (pixels != null && pixels/font_size < 0.12)
                                ret.push(RulePotential("potential_letter_spacing_style"));
                            else
                                ret.push(RulePass("pass"));
                        }    
                    } else 
                        ret.push(RulePass("pass"));
                }        
            } else
                ret.push(RulePass("pass"));
        } 

        const line_style = styles['line-height'];
        let overflow = {"overflow":['auto', 'scroll'], "overflow-x":['auto', 'scroll'], "overflow-y":['auto', 'scroll']};
        if (line_style && RPTUtil.getAncestorWithStyles(ruleContext, overflow) === null) {
            if (ruleContext.style.getPropertyPriority('line-height') === 'important') {
                // computed space is 0 for 'normal' or 'initial'. The 'inherit' will be checked in the parents
                if (line_style === 'initial' || line_style === 'normal')
                    ret.push(RulePotential("potential_line_height_style"));
                else {    
                    const lineHeight = parseFloat(line_style);
                    if (!isNaN(lineHeight)) {
                        let parsed = line_style.trim().match(regex);
                        if (parsed[2] === '') { //line-height is unitless
                            if (parsed[1] < 1.5)
                                ret.push(RulePotential("potential_line_height_style"));
                            else
                                ret.push(RulePass("pass"));
                        } else {
                            let pixels = convertValue2Pixels(parsed[2], parsed[1], ruleContext);
                            if (pixels != null && pixels/font_size < 1.5)
                                ret.push(RulePotential("potential_line_height_style"));
                            else
                                ret.push(RulePass("pass"));
                        }    
                    } else 
                        ret.push(RulePass("pass"));
                    }    
            } else
                ret.push(RulePass("pass")); 
        } 
         
        if (ret.length > 0) 
            return ret;
       
        return null;  //implicable or ignore
        
    }    
}