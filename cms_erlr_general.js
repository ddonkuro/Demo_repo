(function (window) {

    'use strict';

    var cms_main_tab1 = function () {

        var initialized = false;


        var dateFieldsPastPresent =
            [
                'GEN_CUST_INIT_CONTACT_DT',
                'GEN_INVESTIGATE_START_DT',
                'GEN_INVESTIGATE_END_DT',
            ];

        var dateFieldsPresentFuture =
            [];

	function someFunction(){
		
	}
        var reqFieldForActivity =
            [
                {
                    actName: globalVars.actAll,
                    reqFieldIds:
                        [
                            'GEN_PRIMARY_SPECIALIST',
                            'GEN_CUSTOMER_SEARCH',
                            'GEN_CASE_DESC',
                            'GEN_CUST_INIT_CONTACT_DT',
							'GEN_CASE_TYPE'
                        ]
                },
                {
                    actName: globalVars.actCaseCreation,
                    reqFieldIds:
                        []
                },
                {
                    actName: globalVars.actCaseComplete,
                    reqFieldIds:
                        [
                            'GEN_CASE_TYPE',
                            'GEN_CASE_CATEGORY',
                            'GEN_INVESTIGATE_START_DT',
							'GEN_STD_CONDUCT',
							'GEN_STD_CONDUCT_TYPE'
                        ]
                }
            ];

        var groups = [
            'cms_rep_name_group',
            'investigation_conducted_date_group',
            'primary_rep_group',
            'non_cms_primary_group',
            'non_cms_primary_2_group'
        ];

        var cmsPrimRepAutocomplete = null;
        var caseCategDropdown = null;


        function populateCaseCategoryOptions() {
            var caseTypeState = FormState.getState('GEN_CASE_TYPE');
            if (typeof caseTypeState == 'undefined' || caseTypeState == null) return;
            var caseTypeTxt = caseTypeState.text;
            caseTypeTxt = caseTypeTxt.replace('/', '*/*'); // replace slash to distinguish literal from path separator in lookup manager
            var optionLookupArray = LookupManager.findByLTYPE('ERLRInitialResponseCaseType[' + caseTypeTxt + ']/ERLRCaseCategory');
            if (typeof optionLookupArray == 'undefined' || optionLookupArray == null || !$.isArray(optionLookupArray)) return;

            var optionStr = "<option value selected>Select One</option>";
            for (var i = 0; i < optionLookupArray.length; i++) {
                optionStr += "<option value=\"" + optionLookupArray[i].ID + "\">" + optionLookupArray[i].LABEL + "</option>";
            }
            $('#GEN_CASE_CATEGORY').find('option').remove().end().append(optionStr); // refresh Case Category options
        }

        function controlPrimarySpecialistVisibility() {
            if (FormMain.isCreateCaseActivity()) {
                var elemVal = FormState.getElementValue('GEN_PRIMARY_SPECIALIST');
                if (typeof elemVal === 'undefined') {
                    elemVal = '[U]' + basicWIHActionClient.getWorkitemContext().Process.Initiator;
                    FormState.updateSelectValue('GEN_PRIMARY_SPECIALIST', elemVal, '');
                }

                var elemTxt = $('#GEN_PRIMARY_SPECIALIST option[value="' + elemVal + '"]').text();
                if (typeof elemTxt == 'undefined' || elemTxt == null || elemTxt.trim().length <= 0) return;
                // control Primary Specialist in form summary bar area
                var searchIndex = elemTxt.indexOf('(');
                if (searchIndex != null && searchIndex > -1) {
                    FormMain.updatePrimarySpecialistStatusBar(elemTxt.substring(0, searchIndex));
                } else {
                    FormMain.updatePrimarySpecialistStatusBar(elemTxt);
                }
            } else {
                hyf.util.disableComponent('GEN_PRIMARY_SPECIALIST');
                var elemVal = FormState.getElementValue('GEN_PRIMARY_SPECIALIST');
                var elemTxt = $('#GEN_PRIMARY_SPECIALIST option[value="' + elemVal + '"]').text();
                if (typeof elemTxt == 'undefined' || elemTxt == null || elemTxt.trim().length <= 0) return;
                // control Primary Specialist in form summary bar area
                var searchIndex = elemTxt.indexOf('(');
                if (searchIndex != null && searchIndex > -1) {
                    FormMain.updatePrimarySpecialistStatusBar(elemTxt.substring(0, searchIndex));
                } else {
                    FormMain.updatePrimarySpecialistStatusBar(elemTxt);
                }
            }
        }

        function controlSecondarySpecialistVisibility() {
            if (FormMain.isCreateCaseActivity()) {
                //
            } else {
                hyf.util.disableComponent('GEN_SECONDARY_SPECIALIST');
            }
        }

        function controlCaseStatusVisibility() {
            var elemVal = FormState.getElementValue('GEN_CASE_STATUS');
            var elemTxt = $('#GEN_CASE_STATUS option[value="' + elemVal + '"]').text();
            if (typeof elemTxt == 'undefined' || elemTxt == null || elemTxt.trim().length <= 0) return;
            // control Case Status in form summary bar area
            FormMain.updateCaseStatusStatusBar(elemTxt);
        }

        function controlCustomerDetailVisibility() {
            var elemVal = FormState.getElementValue('GEN_CUSTOMER_NAME');
            if (typeof elemVal != 'undefined' && elemVal != null && elemVal.trim().length > 0) {
                CommonOpUtil.showHideLayoutGroup('GEN_CUSTOMER_detail_group', true);
                CommonOpUtil.showHideLayoutGroup('GEN_CUSTOMER_search_group', false);
            } else {
                CommonOpUtil.showHideLayoutGroup('GEN_CUSTOMER_detail_group', false);
                CommonOpUtil.showHideLayoutGroup('GEN_CUSTOMER_search_group', true);
            }
        }

        function controlEmployeeDetailVisibility() {
            var elemVal = FormState.getElementValue('GEN_EMPLOYEE_NAME');
            if (typeof elemVal != 'undefined' && elemVal != null && elemVal.trim().length > 0) {
                CommonOpUtil.showHideLayoutGroup('GEN_EMPLOYEE_detail_group', true);
                CommonOpUtil.showHideLayoutGroup('GEN_EMPLOYEE_search_group', false);
            } else {
                CommonOpUtil.showHideLayoutGroup('GEN_EMPLOYEE_detail_group', false);
                CommonOpUtil.showHideLayoutGroup('GEN_EMPLOYEE_search_group', true);
            }
        }

        function controlPrimaryRepVisibility() {
            var elemVal = FormState.getElementValue('GEN_PRIMARY_REP');
            CommonOpUtil.showHideLayoutGroup('cms_rep_name_group', ('CMS' === elemVal));
            CommonOpUtil.showHideLayoutGroup('non_cms_primary_group', ('NON-CMS' === elemVal));
            CommonOpUtil.showHideLayoutGroup('non_cms_primary_2_group', ('NON-CMS' === elemVal));
            if ('CMS' === elemVal && typeof cmsPrimRepAutocomplete != 'undefined' && cmsPrimRepAutocomplete != null) {
                cmsPrimRepAutocomplete.deleteAllItems();
            }
        }

        function controlCaseTypeVisibility() {
            var elemVal = FormState.getElementValue('GEN_CASE_TYPE');
            var elemTxt = $('#GEN_CASE_TYPE option[value="' + elemVal + '"]').text();
            CommonOpUtil.showHideLayoutGroup('case_type_perf_group', ('Conduct Issue' === elemTxt || 'Investigation' === elemTxt));
            populateCaseCategoryOptions();
        }

        function controlInvestigationVisibility() {
            var elemVal = FormState.getElementValue('GEN_INVESTIGATION');
            CommonOpUtil.showHideLayoutGroup('primary_start_end_date_group', ('Yes' === elemVal));
        }

        function controlStdConductVisibility() {
            var elemVal = FormState.getElementValue('GEN_STD_CONDUCT');
            CommonOpUtil.showHideLayoutGroup('conduct_type_group', ('Yes' === elemVal));
        }

        function controlContactInfoVisibility(id) {
            if (typeof id == 'undefined' || id == null || id.trim().length <= 0) return;
            //item.firstName + ',' + item.middleName + ',' + item.lastName + ',' + item.email + ',' + item.adminCode + ',' + item.adminCodeDesc;
            var elemVal = FormState.getElementValue(id);
            if (typeof elemVal == 'undefined' || elemVal == null || elemVal.trim().length <= 0) return;

            try {
                var item = JSON.parse(elemVal)
                selectionCallBackForContactInfo(item, id + '_SEARCH');
            } catch (e) {
            }
        }

        function initVisibility() {
            controlPrimarySpecialistVisibility();
            controlSecondarySpecialistVisibility();
            controlCaseStatusVisibility();
            controlCustomerDetailVisibility();
            controlEmployeeDetailVisibility();
            controlPrimaryRepVisibility();
            controlCaseTypeVisibility();
            controlInvestigationVisibility();
            controlStdConductVisibility();
            controlContactInfoVisibility('GEN_CUSTOMER');
            controlContactInfoVisibility('GEN_EMPLOYEE');
        }


        function setSelectElemValue(selElem) {
            if (typeof selElem == 'undefined' || selElem == null
                || typeof selElem.id == 'undefined' || selElem.id == null
                || typeof selElem.options == 'undefined' || selElem.options == null) {
                return;
            }
            var selectedVal = selElem.options[selElem.options.selectedIndex].value;
            var selectedTxt = selElem.options[selElem.options.selectedIndex].text;
            FormState.updateSelectValue(selElem.id, selectedVal, selectedTxt);
        }

        function initEventHandlers() {
			var startDate = FormState.getElementValue('GEN_INVESTIGATE_START_DT');
			if(!(startDate && startDate !='')){
				hyf.util.disableComponent('GEN_INVESTIGATE_END_DT');				
			}				
            if (FormMain.isCreateCaseActivity()) {
                $('#GEN_PRIMARY_SPECIALIST').on('change', function (e) {
                    setSelectElemValue(e.target);
                    controlPrimarySpecialistVisibility();
                });
            }

            $('#GEN_CASE_STATUS').on('change', function (e) {
                setSelectElemValue(e.target);
                controlCaseStatusVisibility();
            });
			
			$('#GEN_INVESTIGATE_START_DT').on('change', function (e) {
                if(e.target && e.target.value && e.target.value !=''){
					hyf.util.enableComponent('GEN_INVESTIGATE_END_DT');
					$('#GEN_INVESTIGATE_END_DT').val('');
					FormState.updateDateValue('GEN_INVESTIGATE_END_DT','', false);	
				}else{
					$('#GEN_INVESTIGATE_END_DT').val('');
					FormState.updateDateValue('GEN_INVESTIGATE_END_DT','', false);
					hyf.util.disableComponent('GEN_INVESTIGATE_END_DT');
				}
            });

            $('#GEN_PRIMARY_REP').on('change', function (e) {
                setSelectElemValue(e.target);
                controlPrimaryRepVisibility();
            });

            if (FormMain.isTriggeredCase()){
                $('#GEN_CASE_TYPE').prop('disabled', true);
            }else{
                $('#GEN_CASE_TYPE').on('change', function (e) {
                    setSelectElemValue(e.target);
                    if (typeof caseCategDropdown != 'undefined' && caseCategDropdown != null) {
                        caseCategDropdown.deleteAllItems();
                    }
                    populateCaseCategoryOptions();
                    controlCaseTypeVisibility();
                    FormMain.controlTabVisibility();
                });
            }

            $('#GEN_INVESTIGATION').on('change', function (e) {
                setSelectElemValue(e.target);
                controlInvestigationVisibility();
            });

            $('#GEN_STD_CONDUCT').on('change', function (e) {
                setSelectElemValue(e.target);
                controlStdConductVisibility();
            });

            $('#btnDeleteCustomer').on('click', function (e) {
                $('#GEN_CUSTOMER').val('');
                $('#GEN_CUSTOMER_PHONE').val('');
                $('#GEN_CUSTOMER_NAME').text('');
                $('#GEN_CUSTOMER_ADMIN_CD').text('');
                $('#GEN_CUSTOMER_ADMIN_CD_DESC').text('');
                $('#GEN_CUSTOMER_BUS_CD').text('');
                $('#GEN_CUSTOMER_ID').text('');
                FormState.updateObjectValue('GEN_CUSTOMER', '');
                FormState.updateTextValue('GEN_CUSTOMER_PHONE', '');
                FormState.updateVariableValue('GEN_CUSTOMER_NAME', '');
                FormState.updateVariableValue('GEN_CUSTOMER_ADMIN_CD', '');
                FormState.updateVariableValue('GEN_CUSTOMER_BUS_CD', '');
                FormState.updateVariableValue('GEN_CUSTOMER_ID', '');
                hyf.util.hideComponent('GEN_CUSTOMER_detail_group');
                hyf.util.setMandatoryConstraint('GEN_CUSTOMER_SEARCH', true);
                hyf.util.showComponent('GEN_CUSTOMER_search_group');
                $('#GEN_CUSTOMER_SEARCH').focus();
            });

            if (FormMain.isTriggeredCase() && FormState.getElementBooleanValue('_disableDeleteEmployeeInfo', false)){
                $('#btnDeleteEmployee').css('visibility', 'hidden');
            }else{
                $('#btnDeleteEmployee').on('click', function (e) {
                    $('#GEN_EMPLOYEE').val('');
                    $('#GEN_EMPLOYEE_PHONE').val('');
                    $('#GEN_EMPLOYEE_NAME').text('');
                    $('#GEN_EMPLOYEE_ADMIN_CD').text('');
                    $('#GEN_EMPLOYEE_ADMIN_CD_DESC').text('');
                    $('#GEN_EMPLOYEE_BUS_CD').text('');
                    $('#GEN_EMPLOYEE_ID').text('');
                    FormState.updateObjectValue('GEN_EMPLOYEE', '', true);
                    FormState.updateTextValue('GEN_EMPLOYEE_PHONE', '');
                    FormState.updateVariableValue('GEN_EMPLOYEE_NAME', '');
                    FormState.updateVariableValue('GEN_EMPLOYEE_ADMIN_CD', '');
                    FormState.updateVariableValue('GEN_EMPLOYEE_BUS_CD', '');
                    FormState.updateVariableValue('GEN_EMPLOYEE_ID', '');
                    hyf.util.hideComponent('GEN_EMPLOYEE_detail_group');
                    hyf.util.showComponent('GEN_EMPLOYEE_search_group');
                    loadRelatedCase();
                    $('#GEN_EMPLOYEE_SEARCH').focus();
                });
            }
        }


        function selectionCallBackForContactInfo(items, id) {
            var item = null;
            if (typeof items != 'undefined' && items != null) {
                if ($.isArray(items) && items.length > 0) {
                    item = items[0];
                } else {
                    item = items;
                }
            }

            var idPfx = id.substring(0, id.lastIndexOf('_SEARCH'));
            // set id of elements that need to be populated
            // NOTE: make sure the related element id conforms to the convention
            var storageElemId = idPfx;
            var nameElemId = idPfx + '_NAME';
            var adminCdElemId = idPfx + '_ADMIN_CD';
            var adminCdDescElemId = idPfx + '_ADMIN_CD_DESC';
            var busCdElemId = idPfx + '_BUS_CD';
            var IdElemId = idPfx + '_ID';
            // set id for the display group containing related fields
            // NOTE: make sure the container group id conforms to the convention

            var validName = (item != null && item.lastName && item.firstName) ? true : false;
            if (!validName) {
                hyf.util.hideComponent(idPfx + '_detail_group');
                if(storageElemId === 'GEN_EMPLOYEE'){
                    clearRelatedCase();
                }
            } else {
                var name = item.lastName + ', ' + item.firstName + ' ' + item.middleName;
                var nameDisp = name;
                if (typeof item.email != 'undefined' && item.email != null && item.email.length > 0) {
                    nameDisp += ' (' + item.email + ')';
                }
                if (typeof item.adminCodeDesc == 'undefined' || item.adminCodeDesc == null || item.adminCodeDesc.length <= 0) {
                    item.adminCodeDesc = '';
                }
                name = name.replace(/undefined/g, '');
                nameDisp = nameDisp.replace(/undefined/g, '');

                $('#' + storageElemId).val(JSON.stringify(item));
                $('#' + nameElemId).text(nameDisp);
                $('#' + adminCdElemId).text(item.adminCode);
                $('#' + adminCdDescElemId).text(item.adminCodeDesc);
                $('#' + busCdElemId).text(item.busCode);
                $('#' + IdElemId).text(item.employeeID);
                $('#' + id).val('');  // clear search input field
                FormState.updateObjectValue(storageElemId, JSON.stringify(item), true);
                FormState.updateVariableValue(nameElemId, name, false);
                FormState.updateVariableValue(adminCdElemId, item.adminCode, false);
                FormState.updateVariableValue(adminCdDescElemId, item.adminCodeDesc, false);
                FormState.updateVariableValue(busCdElemId, item.busCode, false);
                FormState.updateVariableValue(IdElemId, item.employeeID, false);
                hyf.util.showComponent(idPfx + '_detail_group');
                hyf.util.hideComponent(idPfx + '_search_group');
                hyf.util.setMandatoryConstraint(id, false);

                if(storageElemId === 'GEN_EMPLOYEE'){
                    loadRelatedCase();
                }
            }
        }

        function responseProcessorForContactInfo(xmlResponse) {
            var data = $('record', xmlResponse).map(function () {
                return {
                    value: $('LAST_NAME', this).text() + ', ' + $('FIRST_NAME', this).text() + ' ' +$('MIDDLE_NAME', this).text(),
                    firstName: $('FIRST_NAME', this).text(),
                    middleName: $('MIDDLE_NAME', this).text(),
                    lastName: $('LAST_NAME', this).text(),
                    email: $('EMAIL_ADDR', this).text(),
                    adminCode: $('ORG_CD', this).text(),
                    adminCodeDesc: $('ADMIN_CODE_DESC', this).text(),
                    positionTitle: $('POSITION_TITLE_NAME', this).text(),
                    payPlan: $('PAY_PLAN', this).text(),
                    series: $('SERIES', this).text(),
                    grade: $('GRADE', this).text(),
                    step: $('STEP', this).text(),
                    wgiDueDate: $('GVT_WGI_DUE_DATE', this).text(),
                    busCode: $('BUS_CD', this).text(),
                    employeeID: $('HHSID', this).text(),
                    scd: $('SCD', this).text()
                };
            }).get();
            return data;
        }

        function appenderForContactInfo(item) {
            var data = item.lastName + ', ' + item.firstName + ' ' + item.middleName;
            if (typeof item.email != 'undefined' && item.email != null && item.email.length > 0) {
                data += ' (' + item.email + ')';
            }
            return '<a role="option">' + data + '</a>';
        }

        function loadRelatedCase(){
            var caseNumber = FormState.getElementValue('CASE_NUMBER', 0);
            var employeeID = FormState.getElementValue('GEN_EMPLOYEE_ID', 0);
            $('#GEN_RELATED_CASE_SEARCH').prop("disabled", false);
            $.ajax({
                type: 'POST',
                url: '/bizflowwebmaker/cms_erlr_service/relatedCase.do',
                data: {
                    act: 'GET',
                    HHSID: employeeID,
                    CASE_NUMBER: caseNumber,
                },
                dataType: 'xml',
                cache: false,
                success: function (response) {
                    populateRelatedCase(response);
                }
            });

        }
        function addRelatedCase(item){
            var caseNumber = FormState.getElementValue('CASE_NUMBER', 0);
            var employeeID = FormState.getElementValue('GEN_EMPLOYEE_ID', 0);
            var currentUserMemberID = $('#h_currentUserMemberID').val();
            if(!_.isEmpty(item.caseID) && !_.isEmpty(currentUserMemberID)){
                $.ajax({
                    type: 'POST',
                    url: '/bizflowwebmaker/cms_erlr_service/relatedCase.do',
                    data: {
                        act: 'ADD',
                        CASE_NUMBER: caseNumber,
                        RELATED_CASE_NUMBER: item.caseID,
                        MEMBERID: currentUserMemberID,
                        HHSID: employeeID
                    },
                    dataType: 'xml',
                    cache: false,
                    success: function (response) {
                        populateRelatedCase(response);
                    }
                });
            }
        }
        function deleteRelatedCase(caseid){
            var caseNumber = FormState.getElementValue('CASE_NUMBER', 0);
            var employeeID = FormState.getElementValue('GEN_EMPLOYEE_ID', 0);
            var currentUserMemberID = $('#h_currentUserMemberID').val();
            if(!_.isEmpty(caseid) && !_.isEmpty(currentUserMemberID)){
                $.ajax({
                    type: 'POST',
                    url: '/bizflowwebmaker/cms_erlr_service/relatedCase.do',
                    data: {
                        act: 'DEL',
                        CASE_NUMBER: caseNumber,
                        RELATED_CASE_NUMBER: caseid,
                        HHSID: employeeID
                    },
                    dataType: 'xml',
                    cache: false,
                    success: function (response) {
                        populateRelatedCase(response);
                    }
                });
            }
        }

        function clearRelatedCase(){
            var $list=$('#EMPLOYEE_CASE_LIST ul');
            $list.html('');
            $list.append('<li>None</li>');
            $('#GEN_RELATED_CASE_SEARCH').prop("disabled", true);
        }
        function populateRelatedCase(response){
            var currentCaseID = FormState.getElementValue('CASE_NUMBER', 0);
            var data = $('record', response).map(function () {
                var caseid = $('CASE_NUMBER', this).text();
                if(caseid != currentCaseID){
                    return {
                        CASE_NUMBER: caseid,
                        HHSID: $('HHSID', this).text(),
                        DELETABLE: 'T' === $('DELETABLE', this).text(),
                        DISPLAY: $('DISPLAY', this).text()
                    };
                }
            }).get();

            var dataCount = data.length;
            var $list=$('#EMPLOYEE_CASE_LIST ul');
            $list.html('');
            if (0<dataCount){
                $.each(data, function(idx,item){
                    var html = '<li>';
                    if(!FormUtility.isReadOnly() && item.DELETABLE){
                        html += '<a href="#" class="deleteAction" _caseid="'+item.CASE_NUMBER+'" title="Delete case '+item.CASE_NUMBER+'">X</a>';
                    }
                    html += '<span class="caseid">'+item.DISPLAY+'</span></li>';
                    $list.append(html);
                });

                if(!FormUtility.isReadOnly()){
                    $('#EMPLOYEE_CASE_LIST .deleteAction').on('click', function(event){
                        event.preventDefault();
                        var caseid = $(this).attr("_caseid");
                        bootbox.confirm( "Are you sure you want to remove the related case "+ caseid+"?", function(result){
                            if(result){
                                deleteRelatedCase(caseid);
                            }
                        });
                    });
                    //$list.effect("highlight", {}, 3000);
                }
            }else{
                $list.append('<li>None</li>');
            }
        }

        function setupCustomWidget() {
            FormLog.log(FormLog.LOG_LEVEL.DEBUG, 'cms_main_tab1::setupCustomWidget START');

            var activityName = ActivityManager.getActivityName();


            // GEN_CUSTOMER
            FormAutoComplete.setAutoComplete(
                'GEN_CUSTOMER_SEARCH'
                , '/bizflowwebmaker/cms_erlr_service/contactInfo.do?cust='
                , selectionCallBackForContactInfo
                , responseProcessorForContactInfo
                , appenderForContactInfo
            );

            // GEN_EMPLOYEE
            FormAutoComplete.setAutoComplete(
                'GEN_EMPLOYEE_SEARCH'
                , '/bizflowwebmaker/cms_erlr_service/contactInfo.do?emp='
                , selectionCallBackForContactInfo
                , responseProcessorForContactInfo
                , appenderForContactInfo
            );

            FormAutoComplete.setAutoComplete(
                'GEN_RELATED_CASE_SEARCH'
                , function(){
                    var caseNumber = FormState.getElementValue('CASE_NUMBER', 0);
                    var employeeID = FormState.getElementValue('GEN_EMPLOYEE_ID', 0);
                    var keyword = $('#GEN_RELATED_CASE_SEARCH').val();
                    return '/bizflowwebmaker/cms_erlr_service/searchCase.do?CASE_NUMBER='+caseNumber+'&HHSID='+employeeID+'&SEARCH_NUMBER=' + keyword;
                }
                , function (item, id){
                    addRelatedCase(item);
                    $('#GEN_RELATED_CASE_SEARCH').val('');
                }
                , function (xmlResponse) {
                    return $('record', xmlResponse).map(function () {
                        return {
                            value: $('DISPLAY', this).text(),
                            caseID: $('CASE_NUMBER', this).text()
                        };
                    }).get();
                }
                , function (item) {
                    return '<a role="option">' + item.value + '</a>';
                }
            );

            cmsPrimRepAutocomplete = FormAutoComplete.makeAutoCompletion(FormMain.getAutoCompleteOptionForEmployee('GEN_CMS_PRIMARY_REP_SEARCH', 'GEN_CMS_PRIMARY_REP'));

            // set up Case Category dropdown as multi-select widget
            var caseCategDropdownOption = {
                id: 'GEN_CASE_CATEGORY',
                useAddButton: false,
                minSelectionCount: (activityName === 'Complete Case') ? 1 : 0,
                maxSelectionCount: 10,
                mapFunction: function (context) {
                },
                getSelectionLabel: function (item) {
                    return item.text
                },
                getCandidateLabel: function (item) {
                    return item.text;
                },
                getItemID: function (item) {
                    return item.value;
                },
                sortSelectedValues: function (values) {
                    values.sort(function (a, b) {
                        var x = a.text.toLowerCase();
                        var y = b.text.toLowerCase();
                        if(x<y) {
                            return -1;
                        } else if(x>y) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });

                    return values;
                },
                afterItemDisplayed: function (containerId, item) {
                    $('#'+this.id)[0].selectedIndex = 0;
                },
                afterItemDeleted: function (containerId, targetId, item, values) {
                },
                initialItems: FormState.getElementArrayValue('GEN_CASE_CATEGORY_SEL', []),
                setDataToForm: function (values) {
                    FormState.updateObjectValue('GEN_CASE_CATEGORY_SEL', values, false);

                }
            };
            caseCategDropdown = FormAutoComplete.makeAutoCompletion(caseCategDropdownOption);

            FormLog.log(FormLog.LOG_LEVEL.DEBUG, 'cms_main_tab1::setupCustomWidget END');
        }

        function init() {

            //-----------------------------------
            // visibility configuration
            //-----------------------------------
            //layout_group.forEach(function(item,index){
            //	hyf.util.hideComponent(item);
            //});
            initVisibility();

            //-----------------------------------
            // validation configuration
            //-----------------------------------
            CommonOpUtil.setDateConstraintMaximumToday(dateFieldsPastPresent);

            CommonOpUtil.dynamicMandatory(reqFieldForActivity);

            //-----------------------------------
            // event handler configuration
            //-----------------------------------
            initEventHandlers();

            //-----------------------------------
            // custom widget configuration
            //-----------------------------------
            setupCustomWidget();

            initialized = true;
        }

        var firstRendering = true;
        function render() {
            FormLog.log(FormLog.LOG_LEVEL.DEBUG, 'cms_main_tab1::render START');
            FormMain.controlDynamicTab();
			hyf.calendar.setDateConstraint('GEN_INVESTIGATE_END_DT', 'Minimum', 'GEN_INVESTIGATE_START_DT');	
            var mandatoryEmployeeInfo = false;
            // GEN_EMPLOYEE_SEARCH
            if(FormMain.isCompleteCaseActivity()){
                var caseTypeId = FormState.getElementValue('GEN_CASE_TYPE', '');
                // Conduct Issue, Investigation, Medical Documentation, Performance Issue, Probationary Period, Within Grade Increase Denial/Reconsideration, Career Ladder Promotion Denial, Third Party Hearing
                if(-1<_.indexOf(['743','744','746','750','751','809','742','753'], caseTypeId)){
                    if(caseTypeId === '753'){  //Third Party Hearing
                        var appealType = FormState.getElementValue('THRD_PRTY_APPEAL_TYPE', '');
                        if(appealType === 'MSPB'){
                            mandatoryEmployeeInfo = true;
                        }
                    }else{
                        mandatoryEmployeeInfo = true;
                    }
                }
            }
            hyf.util.setMandatoryConstraint('GEN_EMPLOYEE_SEARCH', mandatoryEmployeeInfo);
            if(firstRendering){
                firstRendering = false;
                loadRelatedCase();
            }
            FormLog.log(FormLog.LOG_LEVEL.DEBUG, 'cms_main_tab1::render END');
        }

        return {
            init: init,
            render: render
        };
    };

    var _initializer = window.cms_main_tab1 || (window.cms_main_tab1 = cms_main_tab1());
})(window);