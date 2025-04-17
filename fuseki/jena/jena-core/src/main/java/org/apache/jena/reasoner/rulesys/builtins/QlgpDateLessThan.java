/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.jena.reasoner.rulesys.builtins;


import org.apache.jena.graph.* ;
import org.apache.jena.reasoner.rulesys.* ;


/**
 * Delicate for QLGP app
 * Tests if the first date argument is less than the date second.
 */
public class QlgpDateLessThan extends BaseBuiltin {

    /**
     * Return a name for this builtin, normally this will be the name of the
     * functor that will be used to invoke it.
     */
    @Override
    public String getName() {
        return "qlgpDateLessThan";
    }

    /**
     * Return the expected number of arguments for this functor or 0 if the number is flexible.
     */
    @Override
    public int getArgLength() {
        return 2;
    }

    private boolean isNodeValid(Node n) {
        if (!n.isLiteral()) {
            return false;
        }

        Object vObject = n.getLiteralValue();
        if (!(vObject instanceof String)) {
            return false;
        }

        String v = (String)vObject;

        if (v.isEmpty()) {
            return false;
        }

        return true;
    }

    private int[] extractDayMonthYear(String s) {
        String spliter = "AL";
        if (s.contains(spliter)) {
            s = s.substring(s.indexOf(spliter) + spliter.length());
        }

        int day = 0;
        int month = 0;
        int year = 0;

        String[] parts = s.split("/");
        if (parts.length == 1) {
            year = Integer.parseInt(parts[0]);
        } else if (parts.length == 2) {
            month = Integer.parseInt(parts[0]);
            year = Integer.parseInt(parts[1]);
        } else {
            day = Integer.parseInt(parts[0]);
            month = Integer.parseInt(parts[1]);
            year = Integer.parseInt(parts[2]);
        }

        return new int[] { day, month, year };
    }

    /**
     * This method is invoked when the builtin is called in a rule body.
     * @param args the array of argument values for the builtin, this is an array
     * of Nodes, some of which may be Node_RuleVariables.
     * @param context an execution context giving access to other relevant data
     * @return return true if the buildin predicate is deemed to have succeeded in
     * the current environment
     */
    @Override
    public boolean bodyCall(Node[] args, int length, RuleContext context) {
        checkArgs(length, context);
        Node n1 = getArg(0, args, context);
        Node n2 = getArg(1, args, context);

        if ((!isNodeValid(n1)) || (!isNodeValid(n2))) {
            return false;
        }

        int[] v1 = extractDayMonthYear((String) n1.getLiteralValue());
        int[] v2 = extractDayMonthYear((String) n2.getLiteralValue());

        int day1 = v1[0];
        int month1 = v1[1];
        int year1 = v1[2];
        int day2 = v2[0];
        int month2 = v2[1];
        int year2 = v2[2];

        if (year1 < year2) return true;
        if (year1 > year2) return false;
        if (month1 == 0 || month2 == 0) return false;
        if (month1 < month2) return true;
        if (month1 > month2) return false;
        if (day1 == 0 || day2 == 0) return false;
        return day1 < day2;
    }

}
