Tagger.grid.Group = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        id: 'tagger-grid-group'
        ,url: Tagger.config.connectorUrl
        ,baseParams: {
            action: 'mgr/group/getlist'
        }
        ,save_action: 'mgr/group/updatefromgrid'
        ,autosave: true
        ,fields: ['id','name', 'field_type', 'remove_unused', 'allow_new', 'allow_blank', 'allow_type', 'show_autotag', 'show_for_templates', 'position']
        ,autoHeight: true
        ,paging: true
        ,remoteSort: true
        ,ddGroup: 'TaggerDDGroup'
        ,enableDragDrop: true
        ,columns: [{
            header: _('id')
            ,dataIndex: 'id'
            ,width: 70
            ,sortable: true
        },{
            header: _('tagger.group.name')
            ,dataIndex: 'name'
            ,width: 200
            ,sortable: true
            ,editor: { xtype: 'textfield' }
        },{
            header: _('tagger.group.field_type')
            ,dataIndex: 'field_type'
            ,width: 200
            ,sortable: true
            ,editor: { xtype: 'tagger-combo-field-type', renderer: true }
        },{
            header: _('tagger.group.remove_unused')
            ,dataIndex: 'remove_unused'
            ,width: 200
            ,sortable: true
            ,renderer: this.rendYesNo
            ,editor: { xtype: 'modx-combo-boolean' }
        },{
            header: _('tagger.group.allow_new')
            ,dataIndex: 'allow_new'
            ,width: 200
            ,sortable: true
            ,renderer: this.rendYesNo
            ,editor: { xtype: 'modx-combo-boolean' }
        },{
            header: _('tagger.group.allow_blank')
            ,dataIndex: 'allow_blank'
            ,width: 200
            ,sortable: true
            ,renderer: this.rendYesNo
            ,editor: { xtype: 'modx-combo-boolean' }
        },{
            header: _('tagger.group.allow_type')
            ,dataIndex: 'allow_type'
            ,width: 200
            ,sortable: true
            ,renderer: this.rendYesNo
            ,editor: { xtype: 'modx-combo-boolean' }
        },{
            header: _('tagger.group.show_autotag')
            ,dataIndex: 'show_autotag'
            ,width: 200
            ,sortable: true
            ,renderer: this.rendYesNo
            ,editor: { xtype: 'modx-combo-boolean' }
        },{
            header: _('tagger.group.show_for_templates')
            ,dataIndex: 'show_for_templates'
            ,width: 200
        },{
            header: _('tagger.group.position')
            ,dataIndex: 'position'
            ,width: 200
            ,hidden: true
            ,editor: {xtype: 'numberfield', allowDecimal: false, allowNegative: false}
        }]
        ,tbar: [{
            text: _('tagger.group.create')
            ,handler: this.createGroup
            ,scope: this
        },'->',{
            xtype: 'textfield'
            ,emptyText: _('tagger.global.search') + '...'
            ,listeners: {
                'change': {fn:this.search,scope:this}
                ,'render': {fn: function(cmp) {
                    new Ext.KeyMap(cmp.getEl(), {
                        key: Ext.EventObject.ENTER
                        ,fn: function() {
                            this.fireEvent('change',this);
                            this.blur();
                            return true;
                        }
                        ,scope: cmp
                    });
                },scope:this}
            }
        }]
    });
    Tagger.grid.Group.superclass.constructor.call(this,config);

    this.on('render', this.registerGridDropTarget, this);
};
Ext.extend(Tagger.grid.Group,MODx.grid.Grid,{
    windows: {}

    ,getMenu: function() {
        var m = [];
        m.push({
            text: _('tagger.group.update')
            ,handler: this.updateGroup
        });
        m.push('-');
        m.push({
            text: _('tagger.group.remove')
            ,handler: this.removeGroup
        });
        this.addContextMenuItem(m);
    }
    
    ,createGroup: function(btn,e) {
        var createGroup = MODx.load({
            xtype: 'tagger-window-group'
            ,title: _('tagger.group.create')
            ,listeners: {
                'success': {fn:function() { this.refresh(); },scope:this}
            }
        });

//        createGroup.fp.getForm().reset();
        createGroup.show(e.target);
    }

    ,updateGroup: function(btn,e) {

        var updateGroup = MODx.load({
            xtype: 'tagger-window-group'
            ,title: _('tagger.group.update')
            ,action: 'mgr/group/update'
            ,record: this.menu.record
            ,listeners: {
                'success': {fn:function() { this.refresh(); },scope:this}
            }
        });

//        updateGroup.fp.getForm().reset();
        updateGroup.fp.getForm().setValues(this.menu.record);
        updateGroup.show(e.target);
    }
    
    ,removeGroup: function(btn,e) {
        if (!this.menu.record) return false;
        
        MODx.msg.confirm({
            title: _('tagger.group.remove')
            ,text: _('tagger.group.remove_confirm')
            ,url: this.config.url
            ,params: {
                action: 'mgr/group/remove'
                ,id: this.menu.record.id
            }
            ,listeners: {
                'success': {fn:function(r) { this.refresh(); },scope:this}
            }
        });
    }

    ,search: function(tf,nv,ov) {
        var s = this.getStore();
        s.baseParams.query = tf.getValue();
        this.getBottomToolbar().changePage(1);
        this.refresh();
    }

    ,getDragDropText: function(){
        if (this.store.sortInfo && this.store.sortInfo.field != 'position') {
            return _('tagger.err.bad_sort_column', {column: 'position'});
        }

        var search = this.getStore().baseParams.query;
        if (search && search != '') {
            return _('tagger.err.clear_filter');
        }

        return _('tagger.global.change_order', {name: this.selModel.selections.items[0].data.name});
    }

    ,registerGridDropTarget: function() {

        var ddrow = new Ext.ux.dd.GridReorderDropTarget(this, {
            copy: false
            ,sortCol: 'position'
            ,listeners: {
                'beforerowmove': function(objThis, oldIndex, newIndex, records) {
                }

                ,'afterrowmove': function(objThis, oldIndex, newIndex, records) {
                    MODx.Ajax.request({
                        url: Tagger.config.connectorUrl
                        ,params: {
                            action: 'mgr/group/ddreorder'
                            ,idGroup: records.pop().id
                            ,oldIndex: oldIndex
                            ,newIndex: newIndex
                        }
                        ,listeners: {
                            'success': {
                                fn: function(r) {
                                    this.target.grid.refresh();
                                },scope: this
                            }
                        }
                    });
                }

                ,'beforerowcopy': function(objThis, oldIndex, newIndex, records) {
                }

                ,'afterrowcopy': function(objThis, oldIndex, newIndex, records) {
                }
            }
        });

        Ext.dd.ScrollManager.register(this.getView().getEditorParent());
    }

    ,destroyScrollManager: function() {
        Ext.dd.ScrollManager.unregister(this.getView().getEditorParent());
    }
});
Ext.reg('tagger-grid-group',Tagger.grid.Group);


