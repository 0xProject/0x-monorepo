import * as Path from "path";
import * as FS from "fs-extra";

import {Component, RendererComponent} from "../../utils/component";
import {OutputEvent} from "../events/OutputEvent";
import {Renderer} from "../Renderer";


/**
 * A plugin that copies the subdirectory ´assets´ from the current themes
 * source folder to the output directory.
 */
@Component("assets")
export class AssetsPlugin extends RendererComponent
{
    /**
     * Should the default assets always be copied to the output directory?
     */
    copyDefaultAssets:boolean = true;


    /**
     * Create a new AssetsPlugin instance.
     */
    initialize() {
        this.listenTo(this.owner, {
            [Renderer.EVENT_BEGIN]: this.onRendererBegin
        });
    }


    /**
     * Triggered before the renderer starts rendering a project.
     *
     * @param event  An event object describing the current render operation.
     */
    private onRendererBegin(event:OutputEvent) {
        var fromDefault = Path.join(Renderer.getDefaultTheme(), 'assets');
        var to = Path.join(event.outputDirectory, 'assets');

        if (this.copyDefaultAssets) {
            FS.copySync(fromDefault, to);
        } else {
            fromDefault = null;
        }

        var from = Path.join(this.owner.theme.basePath, 'assets');
        if (from != fromDefault && FS.existsSync(from)) {
            FS.copySync(from, to);
        }
    }
}
